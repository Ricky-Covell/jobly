"use strict";

const db = require("../db");
const { ExpressError, BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */
  
  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
          `SELECT title
           FROM jobs
           WHERE title = $1`,
        [title]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle AS "companyHandle"`,
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
  
  /** Creates database query string for find()
  *   
  * optional data ( titleLike, minSalary, hasEquity )
  * 
  * Returns queryString
  */ 
  
static makeQueryString(titleLike, minSalary, hasEquity){
    let whereSQL = `WHERE `;

    // add parameter to query string if specified
    if (titleLike) whereSQL += `title ILIKE '%${titleLike}%'`; 
    if (titleLike && (minSalary || hasEquity)) whereSQL += ` AND`
    if (minSalary) whereSQL += ` salary >= ${minSalary}`;      
    if (minSalary && hasEquity) whereSQL += ` AND`;      
    if (hasEquity) whereSQL += ` equity > 0`;
    
    const queryString = `
        SELECT title,
               salary, 
               equity,
               company_handle AS "companyHandle"
        FROM jobs
        ${whereSQL}
        ORDER BY title`   
    return queryString;
}

 /** Finds all jobs within the query parameters.
* 
* optional data { titleLike, minSalary, hasEquity } 
*
* Returns [{ title, salary, equity, companyHandle }, ...]
* 
* Throws BadRequestError if salary is < 0.
* */

static async find(query) {
    const titleLike = 'titleLike' in query ? query.titleLike : false;
    const minSalary = 'minSalary' in query ? query.minSalary : false;
    const hasEquity = 'hasEquity' in query ? query.hasEquity : false;

    // throw 400 if salary is out of range
    if (minSalary) {
      if (minSalary < 0) throw new BadRequestError('Bad Request: minEmployees > maxEmployees');
    }

    const queryString = this.makeQueryString(titleLike, minSalary, hasEquity);
    const jobsRes = await db.query(queryString);
    return jobsRes.rows;
}

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, companyHandle }, ...]
   * */

static async findAll() {
    const jobsRes = await db.query(
        `SELECT title,
                salary,
                equity,
                company_handle AS "companyHandle"
        FROM jobs`);
    return jobsRes.rows;
}

  /** Given a job title, return data about job.
   *
   * Returns { title, salary, equity, companyHandle }
   *   where jobs is [{ title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(title) {
    const jobRes = await db.query(
          `SELECT title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE title = $1`,
        [title]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(title, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
            companyHandle: "company_handle",
        });
    const titleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE title = ${titleVarIdx} 
                      RETURNING title, 
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, title]);
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job: ${title}`);

    return job;
  }

  /** Delete given job from database given title; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(title) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE title = $1
           RETURNING title`,
        [title]);
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job: ${title}`);
  }

  /** Retrieved id of job given a title; returns integer: id
   *
   * Throws NotFoundError if job not found.
   **/

  static async getId(title) {
    const idRes = await db.query(
          `SELECT id
           FROM jobs
           WHERE title = $1`,
        [title]);
    const jobId = idRes.rows[0];        
    if (!jobId) throw new NotFoundError(`No job: ${title}`);

    return jobId.id;
  }

}

module.exports = Job;
