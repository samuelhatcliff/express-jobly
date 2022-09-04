"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

///TODO: move out as set up data as much as possible to _testCommon, figure out how to get that working
// figure out the deal with converting company_handle to companyHandle

/************************************** create */

describe("create", function () {
    const newJob = {
        id: 3,
        title: "New Job3",
        salary: 115000,
        equity: 0,
        company_handle: "c3",
    };

    test("works", async function () {
        const job = await Job.create(newJob);
        const jobId = job.id;
        expect(job).toEqual({
            id: 3,
            title: "New Job3",
            salary: 115000,
            equity: "0",
            company_handle: "c3",
        });
        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${jobId}`);
        expect(result.rows).toEqual([
            {
                id: 3,
                title: "New Job3",
                salary: 115000,
                equity: "0",
                company_handle: "c3",
            },
        ]);
    });

    test("bad request with dupe", async function () {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

// /************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        const newJob = {
            id: 1,
            title: "New Job",
            salary: 115000,
            equity: 0,
            company_handle: "c1",
        };
        const newJob2 = {
            id: 2,
            title: "New Job2",
            salary: 180000,
            equity: 0,
            company_handle: "c2",
        };
        const job1 = await Job.create(newJob);
        const job2 = await Job.create(newJob2);
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: 1,
                title: "New Job",
                salary: 115000,
                equity: "0",
                company_handle: "c1",
            },
            {
                id: 2,
                title: "New Job2",
                salary: 180000,
                equity: "0",
                company_handle: "c2",
            },
        ]);
    });
});

// /************************************** filterBy */

// describe("filterBy", function () {
//     test("not found if no such company", async function () {
//         try {
//             const filters = [{ name: 'hmm' }, { minEmployees: '5' }, { maxEmployees: '200' }]
//             await Company.filterBy(filters);
//             fail();
//         } catch (err) {
//             expect(err instanceof NotFoundError).toBeTruthy();
//         }
//     });
//     test("Only include neccessary SELECT values", async function () {
//         let filters = [{ minEmployees: '1' }, { maxEmployees: '500' }]
//         let company = await Company.filterBy(filters);
//         expect(company[0]).not.toHaveProperty('name')
//         filters = [{ name: 'C1' }];
//         company = await Company.filterBy(filters);
//         expect(company[0]).not.toHaveProperty('num_employees')
//     })
//     test("case-insensitivety ", async function () {
//         let filters = [{ name: 'C1' }];
//         let company = await Company.filterBy(filters);
//         expect(company).toBeTruthy();
//     })
//     test("accurate retreival", async function () {
//         let filters = [{ minEmployees: '1' }, { maxEmployees: '2' }];
//         let company = await Company.filterBy(filters)
//         company = JSON.stringify(company);
//         expect(company).toEqual(expect.not.stringContaining("numEmployees: 3"))
//         filters = [{ minEmployees: '2' }, { maxEmployees: '3' }];
//         company = await Company.filterBy(filters)
//         expect(company).toEqual(expect.not.stringContaining("numEmployees: 1"))
//     })
// });

// /************************************** get */

describe("get", function () {
    test("works", async function () {
        const newJob = {
            id: 1,
            title: "New Job",
            salary: 115000,
            equity: 0,
            company_handle: "c1",
        };
        await Job.create(newJob)
        let job = await Job.get(1);
        expect(job).toEqual({
            id: 1,
            title: "New Job",
            salary: 115000,
            equity: "0",
            company_handle: "c1",
        });
    });
});

// /************************************** update */

describe("update", function () {
    test("works", async function () {
        const newJob = {
            id: 3,
            title: "New Job",
            salary: 115000,
            equity: 0,
            company_handle: "c3",
        };
        const updateData = {
            title: "new title",
            salary: 1000,
            equity: 0.5
        };
        await Job.create(newJob);

        let job = await Job.update(3, updateData);

        expect(job).toEqual({
            id: 3,
            title: "new title",
            salary: 1000,
            equity: "0.5",
            company_handle: "c3"
        })

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
               FROM jobs
               WHERE id = 3`);
        expect(result.rows).toEqual([{
            id: 3,
            title: "new title",
            salary: 1000,
            equity: "0.5",
            company_handle: "c3",
        }]);
    });

    test("works: null fields", async function () {
        const newJob = {
            id: 3,
            title: "New Job",
            salary: 115000,
            equity: 0,
            company_handle: "c3",
        };
        await Job.create(newJob);
        const updateDataSetNulls = {
            salary: null,
            equity: null,
        };

        let job = await Job.update(3, updateDataSetNulls);
        expect(job).toEqual({
            id: 3,
            title: "New Job",
            ...updateDataSetNulls,
            company_handle: "c3"
        });
    });

    test("not found if no such job", async function () {
        const updateData = {
            title: "new title",
            salary: 1000,
            equity: 0.5
        };
        try {
            await Job.update(999999, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update("c1", {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
})

// /************************************** remove */

describe("remove", function () {
    test("works", async function () {
        const newJob = {
            id: 1,
            title: "New Job3",
            salary: 115000,
            equity: 0,
            company_handle: "c3",
        };
        await Job.create(newJob)
        await Job.remove(1);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=1");
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        const newJob = {
            id: 1,
            title: "New Job3",
            salary: 115000,
            equity: 0,
            company_handle: "c3",
        };
        await Job.create(newJob)
        try {
            await Job.remove(9999999);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
});
