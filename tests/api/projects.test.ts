import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { createProjectSchema } from '../../src/types/project.type';

type HonoContext = {
	Variables: {
		user: { id: string; name: string };
	};
};

// Local mock-control flag (avoid globalThis indexing to satisfy TypeScript)
let MOCK_RETURN_EMPTY = false;

// Mock the DB module used by the route before importing the route
vi.mock('../../src/index', () => {
	type ProjectRow = {
		id: string;
		name: string;
		description?: string;
		projectTag: string;
		seriousnessTag: string;
		updatedAt: number;
	};

	const makeMockDb = (projectRow: ProjectRow, memberCount: number) => ({
		select: (sel: unknown) => ({
			from: (_table: unknown) => ({
				where: (_cond: unknown) => {
					// If selecting count, return array immediately (no .limit used in code)
					if (sel && typeof sel === 'object' && 'count' in sel) {
						return [{ count: memberCount }];
					}
					// If a test has requested the mock to return empty results, honor it
					// e.g. set MOCK_RETURN_EMPTY = true in a test
					if (MOCK_RETURN_EMPTY) {
						return { limit: (_n: number) => [] };
					}
					// debug: print where condition shape to help implement conditional behavior
					try {
						const condStr = JSON.stringify(_cond);
						console.log('MOCK_COND:', condStr);
						if (condStr && condStr.includes('nonexistent')) {
							return { limit: (_n: number) => [] };
						}
					} catch (e) {
						// ignore stringify errors and fallthrough to default
					}
					// Otherwise return object that supports .limit(n)
					return {
						limit: (_n: number) => [projectRow],
					};
				},
			}),
		}),
		insert: (_table: unknown) => ({
			values: (_data: unknown) => ({
				returning: <T>() => {
					// This is a very basic mock that just returns the input data with an id and timestamps
					const input = createProjectSchema.parse(_data);
					return [
						{
							id: 'new-project-id',
							...input,
							updatedAt: Date.now(),
						} as unknown as T,
					];
				},
			}),
		}),
		update: (_table: unknown) => ({
			set: (_data: unknown) => ({
				where: (_cond: unknown) => ({
					returning: <T>() => {
						// This is a very basic mock that just returns the input data with the same id and updated timestamp
						const input = createProjectSchema.parse(_data);
						return [
							{
								id: 'existing-project-id',
								...input,
								updatedAt: Date.now(),
							} as unknown as T,
						];
					},
				}),
			}),
		}),
	});

	return {
		getDb: () =>
			makeMockDb(
				{
					id: 'project-1',
					name: 'Test Project',
					description: 'desc',
					projectTag: 'tag',
					seriousnessTag: 'low',
					updatedAt: Date.now(),
				},
				3,
			),
	};
});

import projectApp from '../../src/pages/api/project';

describe('GET /:id', () => {
	it('認証がない場合401を返す', async () => {
		const app = new Hono<HonoContext>();
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects/project-1');
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(401);
	});

	it('プロジェクトの概要とメンバー数を返す', async () => {
		const app = new Hono<HonoContext>();

		// simple auth shim to set `user` in context
		app.use('*', async (c, next) => {
			c.set('user', { id: 'test-user', name: 'Test' });
			await next();
		});

		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);

		const req = new Request('http://localhost/projects/detail/project-1');
		type FetchInit = Parameters<typeof app.fetch>[1];
		const fetchOptions = { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown as FetchInit;
		const res = await app.fetch(req, fetchOptions);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty('id', 'project-1');
		expect(json).toHaveProperty('memberCount', 3);
	});

	it('プロジェクトが見つからない場合404を返す', async () => {
		const app = new Hono<HonoContext>();
		// simple auth shim to set `user` in context
		app.use('*', async (c, next) => {
			c.set('user', { id: 'test-user', name: 'Test' });
			await next();
		});
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		// tell mock to return no rows for this test
		MOCK_RETURN_EMPTY = true;
		try {
			const req = new Request('http://localhost/projects/detail/nonexistent');
			const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
			expect(res.status).toBe(404);
		} finally {
			MOCK_RETURN_EMPTY = false;
		}
	});
});

describe('GET /:tag?/:seriousness?', () => {
	it('認証がない場合401を返す', async () => {
		const app = new Hono<HonoContext>();
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects/tag/low');
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(401);
	});

	it('タグと本気度でフィルタリングされたプロジェクトを返す', async () => {
		const app = new Hono<HonoContext>();
		// simple auth shim to set `user` in context
		app.use('*', async (c, next) => {
			c.set('user', { id: 'test-user', name: 'Test' });
			await next();
		});
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects/tag/low');
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(Array.isArray(json)).toBe(true);
	});

	it('タグと本気度の両方がない場合、全てのプロジェクトを返す', async () => {
		const app = new Hono<HonoContext>();
		// simple auth shim to set `user` in context
		app.use('*', async (c, next) => {
			c.set('user', { id: 'test-user', name: 'Test' });
			await next();
		});
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects');
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(200);
		const json = await res.json();
		console.log(json);
		expect(Array.isArray(json)).toBe(true);
	});

	it('タグはあるが本気度がない場合、タグでフィルタリングされたプロジェクトを返す', async () => {
		const app = new Hono<HonoContext>();
		// simple auth shim to set `user` in context
		app.use('*', async (c, next) => {
			c.set('user', { id: 'test-user', name: 'Test' });
			await next();
		});
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects/tag');
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(Array.isArray(json)).toBe(true);
	});

	it('本気度はあるがタグがない場合、本気度でフィルタリングされたプロジェクトを返す', async () => {
		const app = new Hono<HonoContext>();
		// simple auth shim to set `user` in context
		app.use('*', async (c, next) => {
			c.set('user', { id: 'test-user', name: 'Test' });
			await next();
		});
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects?seriousness=low');
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(Array.isArray(json)).toBe(true);
	});

	it('プロジェクトが見つからない場合、404を返す', async () => {
		const app = new Hono<HonoContext>();
		// simple auth shim to set `user` in context
		app.use('*', async (c, next) => {
			c.set('user', { id: 'test-user', name: 'Test' });
			await next();
		});
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		MOCK_RETURN_EMPTY = true;
		try {
			const req = new Request('http://localhost/projects/detail/nonexistent');
			const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
			expect(res.status).toBe(404);
		} finally {
			MOCK_RETURN_EMPTY = false;
		}
	});
});

describe('POST /', () => {
	it('認証がない場合401を返す', async () => {
		const app = new Hono<HonoContext>();
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects',
			{
				method: 'POST',
				body: JSON.stringify({
					name: 'New Project',
					projectTag: 'new-tag',
					seriousnessTag: 'high'
				}), headers: { 'Content-Type': 'application/json' }
			});
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(401);
	});

	it('プロジェクトを作成して返す', async () => {
		const app = new Hono<HonoContext>();
		// simple auth shim to set `user` in context
		app.use('*', async (c, next) => {
			c.set('user', { id: 'test-user', name: 'Test' });
			await next();
		});
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects', {
			method: 'POST',
			body: JSON.stringify({
				name: 'New Project',
				description: 'A new project description',
				projectTag: 'new-tag',
				seriousnessTag: 'high'
			}),
			headers: { 'Content-Type': 'application/json' }
		});
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(201);
		const json = await res.json() as { name: string; description: string; projectTag: string; seriousnessTag: string };
		expect(json.name).toBe('New Project');
		expect(json.description).toBe('A new project description');
		expect(json.projectTag).toBe('new-tag');
		expect(json.seriousnessTag).toBe('high');
	});

	it('バリデーションエラーの場合400を返す', async () => {
		const app = new Hono<HonoContext>();
		// simple auth shim to set `user` in context
		app.use('*', async (c, next) => {
			c.set('user', { id: 'test-user', name: 'Test' });
			await next();
		});
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects', {
			method: 'POST',
			body: JSON.stringify({
				name: 'Invalid Project',
				// Missing projectTag and seriousnessTag which are required
			}),
			headers: { 'Content-Type': 'application/json' }
		});
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(400);
	});
});

describe('PUT /:id', () => {
	it('認証がない場合401を返す', async () => {
		const app = new Hono<HonoContext>();
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects/existing-project-id', {
			method: 'PUT',
			body: JSON.stringify({
				name: 'Updated Project',
				description: 'Updated description',
				projectTag: 'updated-tag',
				seriousnessTag: 'medium'
			}),
			headers: { 'Content-Type': 'application/json' }
		});
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(401);
	});

	it('プロジェクトを更新して返す', async () => {
		const app = new Hono<HonoContext>();
		// simple auth shim to set `user` in context
		app.use('*', async (c, next) => {
			c.set('user', { id: 'test-user', name: 'Test' });
			await next();
		});
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects/existing-project-id', {
			method: 'PUT',
			body: JSON.stringify({
				name: 'Updated Project',
				description: 'Updated description',
				projectTag: 'updated-tag',
				seriousnessTag: 'medium'
			}),
			headers: { 'Content-Type': 'application/json' }
		});
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(200);
		const json = await res.json() as { name: string; description: string; projectTag: string; seriousnessTag: string };
		expect(json.name).toBe('Updated Project');
		expect(json.description).toBe('Updated description');
		expect(json.projectTag).toBe('updated-tag');
		expect(json.seriousnessTag).toBe('medium');
		console.log(json);
	});

	it('バリデーションエラーの場合400を返す', async () => {
		const app = new Hono<HonoContext>();
		// simple auth shim to set `user` in context
		app.use('*', async (c, next) => {
			c.set('user', { id: 'test-user', name: 'Test' });
			await next();
		});
		const projectAppTyped = projectApp as unknown as Hono;
		app.route('/projects', projectAppTyped);
		const req = new Request('http://localhost/projects/existing-project-id', {
			method: 'PUT',
			body: JSON.stringify({
				name: 'Invalid Update',
				// Missing projectTag and seriousnessTag which are required
			}),
			headers: { 'Content-Type': 'application/json' }
		});
		const res = await app.fetch(req, { env: { TURSO_DB_URL: '', TURSO_AUTH_TOKEN: '' } } as unknown);
		expect(res.status).toBe(400);
	});
});