"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { id, title, salary, equity, company_handle }
     *
     * Returns { id, title, salary, equity, company_handle }
     * */

    static async create({ title, salary, equity, companyHandle }) {

        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle,
            ],
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     *
     * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
     * */

    static async findAll() {
        const jobsRes = await db.query(
            `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs`);
        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
     *
     * Returns { id, title, salary, equity, company_handle }
     *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    // static async filterBy(filters) {
    //     const wheres = []; //where statements based on filters
    //     const vals = []; //vals to be matched with param ids
    //     let numEmployees = ''; //num_employees won't be part of SELECT query if not needed
    //     let name = ''; //name won't be part of SELECT query if not needed
    //     filters.forEach((filter, idx) => { //creates WHERE statement for query and array of values to match with param ids
    //         const col = Object.keys(filter);
    //         if (col[0] === 'minEmployees') {
    //             wheres.push(`num_employees >= $${idx + 1}`);
    //             vals.push(filter[col]);
    //             numEmployees = ',num_employees' //add num_employees to SELECT query
    //         }
    //         if (col[0] === 'maxEmployees') {
    //             wheres.push(`num_employees <= $${idx + 1}`);
    //             vals.push(filter[col]);
    //             numEmployees = ',num_employees'
    //         }
    //         if (col[0] === 'name') {
    //             wheres.push(`name ILIKE $${idx + 1}`);
    //             vals.push(filter[col]);
    //             name = ',name'
    //         }
    //     })
    //     //create SQL query based on above information
    //     let query = `SELECT handle
    // ${name}
    // ${numEmployees}
    // FROM companies`;
    //     query += " WHERE " + wheres.join(" AND ") + " ORDER BY name";
    //     const queryRes = await db.query(query, vals);
    //     const companiesRes = queryRes.rows
    //     if (companiesRes.length === 0) throw new NotFoundError("Couldn't find company that matched search criteria.");
    //     console.log(companiesRes[0], "LLLLLLL", typeof companiesRes)
    //     return companiesRes
    // }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if job not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                company_handle: "companyHandle"
            });
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${data.id}`);
        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        try {
            await db.query(
                `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`,
                [id]);
        } catch (err) {
            throw new NotFoundError(`No job: ${id}`);
        }
    }
}


module.exports = Job;