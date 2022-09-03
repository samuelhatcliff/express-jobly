const { BadRequestError } = require("../expressError");

// This functions formats the data sent in the request body for patch requests for SQL queries
// by converting it from js camel case to snake case
// We return an object that contains appropriate format for each column with the corresponding parameterized query id
// as well as the values pertaining to each column and parameterized query id

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  //Example: {"firstName": "first", "lastName": "last"} => [ 'first', 'last' ]
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  //Example: {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
