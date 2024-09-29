"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "j4",
    salary: 3300,
    equity: "0.2",
    companyHandle: "c2",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'j4'`);
    expect(result.rows).toEqual([
      {
        title: "j4",
        salary: 3300,
        equity: "0.2",
        company_handle: "c2",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** find */

describe("find", function () {
  test("works", async function () {
    const queryObj = {
      titleLike: 'j',
      minSalary: 1,
      hasEquity: true,
    } 
    let jobs = await Job.find(queryObj);
    expect(jobs).toEqual([      
      {
        title: "j2",
        salary: 1000,
        equity: "0.5",
        companyHandle: "c2",
      },
      {
        title: "j3",
        salary: 405000,
        equity: "0.2",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: title search parameter", async function () {
    const queryObj = {
      titleLike: 'J3'
    } 
    let jobs = await Job.find(queryObj);
    expect(jobs).toEqual([
      {
        title: "j3",
        salary: 405000,
        equity: "0.2",
        companyHandle: "c3",
      }
    ]);
  });

  test("works: no matching name", async function () {
    const queryObj = {
      titleLike: 'j6'
    } 
    let jobs = await Job.find(queryObj);
    expect(jobs).toEqual([]);
  });

  test("works: no job within salary range", async function () {
    const queryObj = {
      minSalary: 900500
    } 
    let jobs = await Job.find(queryObj);
    expect(jobs).toEqual([]);
  });

  test("bad request if below min", async function () {
    const queryObj = {
      minSalary: -1
    } 
    try {
      let jobs = await Job.find(queryObj);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});


// /************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        title: "j1",
        salary: 14,
        equity: "0",
        companyHandle: "c1",
      },
      {
        title: "j2",
        salary: 1000,
        equity: "0.5",
        companyHandle: "c2",
      },
      {
        title: "j3",
        salary: 405000,
        equity: `0.2`,
        companyHandle: "c3",
      },
    ]);
  });
});

// /************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("j1");
    expect(job).toEqual({
      title: "j1",
      salary: 14,
      equity: "0",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "newj1",
    salary: 15,
    equity: "0.1",
  };

  test("works", async function () {
    let job = await Job.update("j1", updateData);
    expect(job).toEqual({
      companyHandle: "c1",
      ...updateData,
    });

    // const result = await db.query(
    //       `SELECT title, salary, equity, company_handle
    //        FROM jobs
    //        WHERE title = 'newj1'`);
    // expect(result.rows).toEqual([{
    //   title: "newj1",
    //   salary: 15,
    //   equity: "0.1",
    //   companyHandle: "c1",
    // }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("j1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

// describe("remove", function () {
//   test("works", async function () {
//     await Company.remove("c1");
//     const res = await db.query(
//         "SELECT handle FROM companies WHERE handle='c1'");
//     expect(res.rows.length).toEqual(0);
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Company.remove("nope");
//       fail();
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });
// });
