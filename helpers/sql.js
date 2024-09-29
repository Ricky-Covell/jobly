const { BadRequestError } = require("../expressError");

/** Helper Function: Creates an objects with data received from API update route formatted for SQL Query.
 *
 * If data was provided, return and object which contains:
 * 
 *  setCols: 
 *     A string for the SET portion of the query that contains each column name and it's corresponding variable name
 * 
 *  values: 
 *     An object that contains the updated values for the query
 *
 * Throws an error if no data was provided.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
