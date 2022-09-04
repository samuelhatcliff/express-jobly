"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, requireAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle}
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, requireAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    if (Object.keys(req.query).length === 0) { //checks if no filters are specified in q string
        try {
            const jobs = await Job.findAll();
            return res.json({ jobs });
        } catch (err) {
            return next(err);
        }
    } else {
        try {
            let filters = [];
            for (let property of Object.keys(req.query)) { // creates an array of objects containing property of filter type and their respective values
                //ensures that no invalid property names are present before making the sql query
                if (property !== "title" && property !== "minSalary" && property !== "hasEquity") {
                    throw new BadRequestError(`Request contains invalid query parameter ${property}
            Please only use the following valid parameters: title, minSalary, hasEquity`)
                }
                const value = req.query[property];
                const newObj = {};
                newObj[property] = value;
                filters.push(newObj)
            }
            const jobs = await Job.filterBy(filters);
            return res.json({ jobs })
        } catch (err) {
            return next(err);
        }
    }
});

/** GET /[id]  =>  { jobs }
*
*  Job is { id, title, salary, equity, companyHandle }
*
* Authorization required: none
*/

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[handle] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login, admin
 */

router.patch("/:id", ensureLoggedIn, requireAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login, admin
 */

router.delete("/:id", ensureLoggedIn, requireAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
