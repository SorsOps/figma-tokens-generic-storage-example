import app from '../src/app';
import fs from 'fs';
import path from 'path';
import request from 'supertest';

describe('Tokens', () => {
	describe('GET', () => {
		it('returns a 404 for a missing token set', async () => {
			const res = await request(app).get('/missing');
			expect(res.header['content-type']).toBe(
				'application/json; charset=utf-8'
			);
			expect(res.statusCode).toBe(404);
			expect(JSON.parse(res.text)).toEqual({
				reason: 'Token set does not exist'
			});
		});

		it('retrieves static testing tokens', async () => {
			const res = await request(app).get('/test');
			expect(res.header['content-type']).toBe(
				'application/json; charset=utf-8'
			);
			expect(res.statusCode).toBe(200);
			expect(JSON.parse(res.text)).toEqual({
				$themes: [],
				updatedAt: 1669292463000,
				values: {
					foo: 'bar'
				},
				version: '23'
			});
		});

		it('returns a 404 when missing a specific version', async () => {
			const res = await request(app).get('/test?version=4');
			expect(res.header['content-type']).toBe(
				'application/json; charset=utf-8'
			);
			expect(res.statusCode).toBe(404);
			expect(JSON.parse(res.text)).toEqual({
				reason: 'Version requested does not exist'
			});
		});
	});

	describe('POST', () => {
		it('returns created = false for existing post request', async () => {
			const res = await request(app).post('/test').send({ version: '23' });
			expect(res.header['content-type']).toBe(
				'application/json; charset=utf-8'
			);
			expect(res.statusCode).toBe(200);
			expect(JSON.parse(res.text)).toEqual({
				created: false,
				updatedAt: 1669292463000
			});
		});
		it('returns created = true for a new post request', async () => {
			const filePath = path.join(__dirname, '../db/test2.db');

			if (fs.existsSync(filePath)) {
				fs.rmSync(filePath);
			}

			const res = await request(app)
				.post('/test2')
				.send({
					version: '23',
					updatedAt:
						'Thu Nov 24 2022 14:21:03 GMT+0200 (South Africa Standard Time)'
				});

			expect(res.header['content-type']).toBe(
				'application/json; charset=utf-8'
			);
			expect(res.statusCode).toBe(200);
			expect(JSON.parse(res.text)).toEqual({
				created: true,
				updatedAt: 1669292463000
			});
		});
	});
});
