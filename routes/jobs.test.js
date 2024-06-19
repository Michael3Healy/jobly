'use strict';

const request = require('supertest');

const db = require('../db');
const app = require('../app');

const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, u1Token, u2Token } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe('POST /jobs', function () {
	const newJob = {
		title: 'programmer',
		salary: 450000,
		equity: '0.090',
		companyHandle: 'c1',
	};

	test('ok for admins', async function () {
		const resp = await request(app).post('/jobs').send(newJob).set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			job: newJob,
		});
	});

	test('fails for non admins', async function () {
		const resp = await request(app).post('/jobs').send(newJob).set('authorization', `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('bad request with missing data', async function () {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title: 'help',
				salary: 10000,
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request with invalid data', async function () {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title: 'programmer',
				salary: 'not an integer',
				equity: '0.090',
				companyHandle: 'c1',
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /jobs */

describe('GET /jobs', function () {
	test('ok for anon', async function () {
		const resp = await request(app).get('/jobs');
		expect(resp.body).toEqual({
			jobs: [
				{
					title: 'data scientist',
					salary: 200000,
					equity: '0.90',
					companyHandle: 'c2',
				},
				{
					title: 'junior dev',
					salary: 65000,
					equity: '0',
					companyHandle: 'c3',
				},
				{
					title: 'teacher',
					salary: 10000,
					equity: '0',
					companyHandle: 'c1',
				},
			],
		});
	});

	test('fails with invalid query params', async function () {
		const resp = await request(app).get(`/jobs?description=hello`);
		expect(resp.statusCode).toBe(400);
	});

	test('works: filters based on query', async function () {
		const resp = await request(app).get(`/jobs`).query({ minSalary: 65000, hasEquity: true });
		expect(resp.body).toEqual({
			jobs: [
				{
					title: 'data scientist',
					salary: 200000,
					equity: '0.90',
					companyHandle: 'c2',
				},
			],
		});
	});

	test('fails: test next() titler', async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-titler works with it. This
		// should cause an error, all right :)
		await db.query('DROP TABLE jobs CASCADE');
		const resp = await request(app).get('/jobs').set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});
});

// /************************************** GET /jobs/:title */

describe('GET /jobs/:title', function () {
	test('works for anon', async function () {
		const resp = await request(app).get(`/jobs/teacher`);
		expect(resp.body).toEqual({
			job: {
				title: 'teacher',
				salary: 10000,
				equity: '0',
				companyHandle: 'c1',
			},
		});
	});

	test('not found for no such job', async function () {
		const resp = await request(app).get(`/jobs/nope`);
		expect(resp.statusCode).toEqual(404);
	});
});

// /************************************** PATCH /jobs/:title */

describe('PATCH /jobs/:title', function () {
	test('works for admins', async function () {
		const resp = await request(app)
			.patch(`/jobs/teacher`)
			.send({
				title: 'new title',
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			job: {
				title: 'new title',
				salary: 10000,
				equity: '0',
				companyHandle: 'c1',
			},
		});
	});

	test('unauth for non-admins', async function () {
		const resp = await request(app)
			.patch(`/jobs/teacher`)
			.send({
				name: 'new title',
			})
			.set('authorization', `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(401);
	});

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/teacher`)
        .send({
          name: "new title",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/nope`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on companyHandle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/teacher`)
        .send({
          companyHandle: "new handle",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/teacher`)
        .send({
          salary: "not an int",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** DELETE /jobs/:title */

describe("DELETE /jobs/:title", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/teacher`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "teacher" });
  });

  test('unauth for non-admins', async function () {
    const resp = await request(app).delete('/jobs/teacher')
        .set('authorization', `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  })

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/teacher`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/nope`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
