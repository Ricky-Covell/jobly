const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function (){
    test("works", function () {
        dataToUpdate = {
          'key1': "val1",
          'key2': "val2",
          'key3': "val3"
        };
        jsToSql = {
            'key1': "val_1",
            'key2': "val_2",
            'key3': "val_3"
        };
        testObj = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(testObj).toEqual({
          setCols: '"val_1"=$1, "val_2"=$2, "val_3"=$3',
          values: ['val1', 'val2', 'val3']
        });
      });

    test("works: setCols values are key names if no jsToSql", function () {
      dataToUpdate = {
        key1: "val1",
        key2: "val2",
        key3: "val3"
      };
      jsToSql = {};
      testObj = sqlForPartialUpdate(dataToUpdate, jsToSql);
      expect(testObj).toEqual({
        setCols: '"key1"=$1, "key2"=$2, "key3"=$3',
        values: ['val1', 'val2', 'val3']
      });
    });

    test("no data if none provided", function () {
        dataToUpdate = {};
        jsToSql = {};
        try {
            testObj = sqlForPartialUpdate(dataToUpdate, jsToSql);    
        } catch (err) {
          expect (err instanceof BadRequestError).toBeTruthy();  
        }
      });
});