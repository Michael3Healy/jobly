const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
    test("works: 1 item", function () {
        const dataToUpdate = { firstName: "Aliya" };
        const jsToSql = { firstName: "first_name", lastName: "last_name", isAdmin: "is_admin" };
        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(setCols).toEqual(`"first_name"=$1`);
        expect(values).toEqual(["Aliya"]);
    });
    
    test("works: multiple items", function () {
        const dataToUpdate = { firstName: "Aliya", email: "aliya@gmail.com" };
        const jsToSql = { firstName: "first_name", lastName: "last_name", isAdmin: "is_admin" };
        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(setCols).toEqual(`"first_name"=$1, "email"=$2`);
        expect(values).toEqual(["Aliya", 'aliya@gmail.com']);
    });
    });