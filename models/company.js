"use strict";

const db = require("../db");
const { ExpressError, BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }
  
    /** Creates database query string for find()
  *   
  */ 
  
  static makeQueryString(nameLike, minEmployees, maxEmployees){
    const description = (minEmployees || maxEmployees) ? 'description,' : 'description'
    const numEmplSQL = (minEmployees || maxEmployees) ? 'num_employees AS "numEmployees"' : ''; 
    let whereSQL = `WHERE `;
    

    // add parameter to query string if specified
    if (nameLike) whereSQL += `name ILIKE '%${nameLike}%'`; 
    if (nameLike && (minEmployees || maxEmployees)) whereSQL += ` AND`
    if (minEmployees) whereSQL += ` num_employees >= ${minEmployees}`;      
    if (minEmployees && maxEmployees) whereSQL += ` AND`;      
    if (maxEmployees) whereSQL += ` num_employees <= ${maxEmployees}`;
      
    const queryString = `
           SELECT name,
                  ${description}
                  ${numEmplSQL}
           FROM companies
           ${whereSQL}
           ORDER BY name`   
  
    return queryString;
  }

    /** Finds all company names within the query parameters.
   *
   * Returns [{ name, description }]
   *            OR
   * Returns [{ name, description, numEmployees }] 
   * */

  static async find(query) {
    const name = 'nameLike' in query ? query.nameLike : false;
    const minEmployees = 'minEmployees' in query ? query.minEmployees : false;
    const maxEmployees = 'maxEmployees' in query ? query.maxEmployees : false;
    
    // throw 400 if employees min > max
    if (minEmployees && maxEmployees) {
      if (minEmployees > maxEmployees) throw new BadRequestError('Bad Request: minEmployees > maxEmployees');
    }

    const queryString = this.makeQueryString(name, minEmployees, maxEmployees);
    const companiesRes = await db.query(queryString);
    return companiesRes.rows;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }

      /** Given a company handle, return jobs from company.
   *
   * Returns { title, salary, equity, companyHandle }
   *   where jobs is [{ title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

    static async jobs(companyHandle) {
      const jobRes = await db.query(
            `SELECT title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
             FROM jobs
             WHERE company_handle = $1`,
          [companyHandle]);
  
      const jobs = jobRes.rows;
  
      if (!jobs) throw new NotFoundError(`Company has no jobs: ${companyHandle}`);
  
      return jobs;
    }
}


module.exports = Company;
