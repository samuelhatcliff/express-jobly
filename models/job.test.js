"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

///TODO: move out as set up data as much as possible to _testCommon, figure out how to get that working
// figure out the deal with converting company_handle to companyHandle

/************************************** create */

describe("create", function () {
    let newJob = {
        companyHandle: "c1",
        title: "Test",
        salary: 100,
        equity: "0.1",
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            ...newJob,
            id: expect.any(Number),
        });
    });
});


// /************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 100,
                equity: "0.1",
                companyHandle: "c1",
            },
            {
                id: testJobIds[1],
                title: "Job2",
                salary: 200,
                equity: "0.2",
                companyHandle: "c1",
            },
            {
                id: testJobIds[2],
                title: "Job3",
                salary: 300,
                equity: "0",
                companyHandle: "c1",
            },
            {
                id: testJobIds[3],
                title: "Job4",
                salary: null,
                equity: null,
                companyHandle: "c1",
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
        const job = await Job.get(testJobIds[0])
        expect(job).toEqual({
            id: testJobIds[0],
            title: "Job1",
            salary: 100,
            equity: "0.1",
            companyHandle: "c1",
        })
    });
});

// /************************************** update */

describe("update", function () {
    test("works", async function () {
        const updateData = {
            title: "new title",
            salary: 1000,
            equity: 0.5
        };
        let job = await Job.update(testJobIds[0], updateData)

        expect(job).toEqual({
            id: testJobIds[0],
            title: "new title",
            salary: 1000,
            equity: "0.5",
            companyHandle: "c1"
        })
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            salary: null,
            equity: null,
        };

        let job = await Job.update(testJobIds[0], updateDataSetNulls);
        expect(job).toEqual({
            id: testJobIds[0],
            title: "Job1",
            ...updateDataSetNulls,
            companyHandle: "c1"
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
        try {
            await Job.remove(testJobIds[1])
            await Job.get(testJobIds[1])
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
    test("no found error for non-existant job", async function () {
        try {
            await Job.remove(testJobIds[9999999])
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
});
