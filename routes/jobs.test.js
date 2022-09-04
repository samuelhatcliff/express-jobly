"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
    testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "New Job",
        salary: 200000,
        equity: "0.1",
        companyHandle: "c1",
    };

    //Authorization
    test("unauthorized for non-admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                ...newJob,
                id: expect.any(Number)
            }
        });
    });

    //Schema
    test("bad request with missing data {companyHandle}", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "New Job",
                salary: 100000
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with missing data {title}", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                salary: 100000,
                companyHandle: "c1"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data {equity as number}", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                equity: 0.4,
                salary: 100000,
                companyHandle: "c1"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid {empty values}", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "",
                salary: 200000,
                equity: "",
                companyHandle: "c1",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    { title: "J1", salary: 1, equity: "0.1", companyHandle: "c1", id: expect.any(Number) },
                    { title: "J2", salary: 2, equity: "0.2", companyHandle: "c1", id: expect.any(Number) },
                    { title: "J3", salary: 3, equity: null, companyHandle: "c1", id: expect.any(Number) }
                ],
        });
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /companies/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
        expect(resp.body).toEqual({
            job: {
                title: "J1", salary: 1, equity: "0.1", companyHandle: "c1", id: testJobIds[0]
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/9999999`);
        expect(resp.statusCode).toEqual(404);
    });

    test("tests query filters", async function () {
        const resp = await request(app)
            .get("/jobs?minSalary=1&hasEquity=true")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(200);
    })
    test("only accepts valid filters", async function () {
        const resp = await request(app)
            .get("/jobs?invalid=600&maxEmployees=700")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    })
    // test("min can't be greater than max", async function () {
    //     const resp = await request(app)
    //         .get("/companies?minEmployees=800&maxEmployees=700")
    //         .set("authorization", `Bearer ${u1Token}`);
    //     expect(resp.statusCode).toEqual(400);
    // })
});

/************************************** PATCH /jobs/:handle */

describe("PATCH /jobs/:handle", function () {
    test("works for users", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "New Job Title",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: testJobIds[0],
                title: "New Job Title",
                salary: 1,
                equity: "0.1",
                companyHandle: "c1"
            },
        });
    });

    test("unauthorized for non admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "New Job Title",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/9999999`)
            .send({
                title: "New Job Title",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on id change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                id: 88888,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data {equity as number}", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                equity: 0.4
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:handle", function () {
    test("unauthorized for non admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("works for admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: `${testJobIds[0]}` });
    });

    test("unauthorized for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`);
        expect(resp.statusCode).toEqual(401);
    });
});
