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


    static async filterBy(filters) {
        let paramId = 0;
        const wheres = []; //where statements based on filters
        const vals = []; //vals to be matched with param ids
        filters.forEach((filter) => { //creates WHERE statement for query and array of values to match with param ids
            const col = Object.keys(filter);
            if (col[0] === 'hasEquity') {
                if (filter[col] === 'true') {
                    wheres.push(`equity > 0`);
                }
            }
            if (col[0] === 'minSalary') {
                wheres.push(`salary >= $${paramId + 1}`);
                vals.push(filter[col]);
                paramId++;
            }
            if (col[0] === 'title') {
                wheres.push(`title ILIKE $${paramId + 1}`);
                vals.push(filter[col]);
                paramId++;
            }
        })
        //create SQL query based on above information
        let query = `SELECT id,
    title,
    salary,
    equity,
    company_handle
    FROM jobs`;
        query += " WHERE " + wheres.join(" AND ") + " ORDER BY company_handle";
        const queryRes = await db.query(query, vals);
        const jobsRes = queryRes.rows
        if (jobsRes.length === 0) {
            throw new NotFoundError("Couldn't find and jobs that matched search criteria.");
        }
        return jobsRes
    }

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