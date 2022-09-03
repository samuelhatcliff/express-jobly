const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("provides sql format for partial updates", function () {
    test("setCols is appropriate response", function () {
        const { setCols } = sqlForPartialUpdate(
            { "firstName": "first", "lastName": "last" },
            {
                firstName: "first_name",
                lastName: "last_name",
                isAdmin: "is_admin",
            });
        expect(setCols).toEqual(`"first_name"=$1, "last_name"=$2`)
    })
    test("values is appropriate response", function () {
        const { values } = sqlForPartialUpdate(
            { "firstName": "first", "lastName": "last" },
            {
                firstName: "first_name",
                lastName: "last_name",
                isAdmin: "is_admin",
            });
        expect(values).toEqual(['first', 'last'])
    })
});