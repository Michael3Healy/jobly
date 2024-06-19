'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Job = require('./job.js');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('create', function () {
	const newJob = {
		title: 'doctor',
		salary: 120000,
		equity: '0.080',
		companyHandle: 'c3',
	};

	test('works', async function () {
		let job = await Job.create(newJob);
		expect(job).toEqual(newJob);

		const result = await db.query(
			`SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'doctor'`
		);
		expect(result.rows).toEqual([newJob]);
	});

	test('bad request with dupe', async function () {
		try {
			await Job.create(newJob);
			await Job.create(newJob);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

// /************************************** findAll */

describe('find', function () {
	test('works: no filter', async function () {
		let jobs = await Job.find();
		expect(jobs).toEqual([
			{ title: 'astronaut', salary: 100000, equity: '0', companyHandle: 'c2' },
			{ title: 'engineer', salary: 90000, equity: '0', companyHandle: 'c1' },
			{ title: 'fisherman', salary: 40000, equity: '0.070', companyHandle: 'c3' },
		]);
	});

	test('works: filter minSalary and title', async function () {
		let jobs = await Job.find({ minSalary: 90000, title: 'astro' });
		expect(jobs).toEqual([{ title: 'astronaut', salary: 100000, equity: '0', companyHandle: 'c2' }]);
	});
});
// /************************************** get */

describe('get', function () {
	test('works', async function () {
		let job = await Job.get('fisherman');
		expect(job).toEqual({ title: 'fisherman', salary: 40000, equity: '0.070', companyHandle: 'c3' });
	});

	test('not found if no such job', async function () {
		try {
			await Job.get('nope');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

// /************************************** update */

describe('update', function () {
	const updateData = {
		title: 'ice fisherman',
		salary: 100000,
	};

	test('works', async function () {
		let job = await Job.update('fisherman', updateData);
		expect(job).toEqual({
			equity: '0.070',
			companyHandle: 'c3',
			...updateData,
		});

		const result = await db.query(
			`SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'ice fisherman'`
		);
		expect(result.rows).toEqual([
			{
				equity: '0.070',
				companyHandle: 'c3',
				...updateData,
			},
		]);
	});

	test('works: null fields', async function () {
		const updateDataSetNulls = {
			salary: null,
			equity: null,
		};

		let job = await Job.update('astronaut', updateDataSetNulls);
		expect(job).toEqual({
			title: 'astronaut',
			companyHandle: 'c2',
			...updateDataSetNulls,
		});

		const result = await db.query(
			`SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'astronaut'`
		);
		expect(result.rows).toEqual([
			{
				title: 'astronaut',
				companyHandle: 'c2',
				...updateDataSetNulls,
			},
		]);
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
      await Job.update("astronaut", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove("astronaut");
    const res = await db.query(
        "SELECT title FROM jobs WHERE title='astronaut'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
