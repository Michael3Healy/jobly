const { BadRequestError } = require("../expressError");

/** Generate the SET clause of a SQL UPDATE statement
 * 
 * dataToUpdate: object with keys and values to update
 * 
 * jsToSql: object mapping js-style data keys to database column names,
 * like { firstName: "first_name" }
 * 
 * Returns {setCols, values}
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // setCols: '"first_name"=$1, "age"=$2'
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
