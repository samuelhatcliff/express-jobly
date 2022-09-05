"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");

/** Related functions for applications. */

class Application {
    /** Create an application (from username and jobId), update db, return application data.
     *
     * data should be { username, jobId }
     *
     * Returns {applied: jobId}
     * */
    static async create(username, jobId) {
        const jobCheck = await db.query(
            `SELECT id
             FROM jobs
             WHERE id = $1`, [jobId]);
        if (!jobCheck.rows[0]) {
            throw new NotFoundError(`Job with id of ${jobId} not found.`)
        }

        const userCheck = await db.query(
            `SELECT username
             FROM users
             WHERE username = $1`, [username]);
        if (!userCheck.rows[0]) {
            throw new NotFoundError(`User with username ${username} not found.`)
        }

        await db.query(
            `INSERT INTO applications (job_id, username)
             VALUES ($1, $2)`,
            [jobId, username]);
        return { applied: jobId };
    }
}


module.exports = Application;