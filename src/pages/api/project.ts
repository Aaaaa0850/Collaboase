import { Hono } from 'hono';
import { auth } from '../../lib/auth';
import { getDb } from '../../index';
import { projects, projectMembers } from '../../db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator'
import { projectSchema, createProjectSchema } from '../../types/project.type';
import { nanoid } from 'nanoid';

interface Variables {
	user: ReturnType<typeof auth>['$Infer']['Session']['user'] | null;
	session: ReturnType<typeof auth>['$Infer']['Session']['session'] | null;
}

interface Bindings {
	BETTER_AUTH_URL?: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	TURSO_DB_URL: string;
	TURSO_AUTH_TOKEN: string;
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

const _routes = app
	.get('/detail/:id', async (c) => {
		const user = c.get('user');
		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}
		const db = getDb({
			TURSO_DB_URL: c.env.TURSO_DB_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN
		});
		const { id } = c.req.param();
		try {
			const projectData = await db
				.select({
					id: projects.id,
					name: projects.name,
					description: projects.description,
					projectTag: projects.projectTag,
					seriousnessTag: projects.seriousnessTag,
					updatedAt: projects.updatedAt,
				})
				.from(projects)
				.where(eq(projects.id, id))
				.limit(1);
			if (!projectData || projectData.length === 0) {
				return c.json({ error: 'Project not found' }, 404);
			}
			const project = projectSchema.parse(projectData[0]);
			if (!project) {
				return c.json({ error: 'サーバエラー' }, 500);
			}
			const countResult = await db
				.select({ count: sql<number>`COUNT(*)` })
				.from(projectMembers)
				.where(eq(projectMembers.projectId, id));
			const memberCount = countResult && countResult.length > 0 ? Number(countResult[0].count) : 0;
			return c.json({ ...project, memberCount }, 200);
		} catch (error) {
			console.error('Error fetching project:', error);
			return c.json({ error: 'サーバエラー' }, 500);
		}
	})
	.get('/:tag?/:seriousness?', async (c) => {
		const user = c.get('user');
		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}
		const db = getDb({
			TURSO_DB_URL: c.env.TURSO_DB_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN
		});
		const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
		// 正規化：パスパラメータが空文字の場合は undefined とし、クエリパラメータをフォールバックで使う
		const params = c.req.param();
		const url = new URL(c.req.url);
		const qTag = url.searchParams.get('tag') ?? undefined;
		const qSeriousness = url.searchParams.get('seriousness') ?? undefined;
		const tag = params.tag === '' ? undefined : (params.tag ?? qTag);
		const seriousness = params.seriousness === '' ? undefined : (params.seriousness ?? qSeriousness);
		const conditions = [
			gte(projects.updatedAt, new Date(monthAgo)),
			tag ? eq(projects.projectTag, tag) : undefined, // タグが指定されている場合のみ条件に追加
			seriousness ? eq(projects.seriousnessTag, seriousness) : undefined, // 真剣度が指定されている場合のみ条件に追加
		].filter(Boolean);
		try {
			const projectsData = await db
				.select({
					id: projects.id,
					name: projects.name,
					description: projects.description,
					projectTag: projects.projectTag,
					seriousnessTag: projects.seriousnessTag,
					updatedAt: projects.updatedAt,
				})
				.from(projects)
				.where(
					and(
						...conditions
					)
				)
				.limit(300);
			if (!projectsData || projectsData.length === 0) {
				return c.json({ error: 'Project not found' }, 404);
			}
			const shuffledProjects = projectsData.sort(() => Math.random() - 0.5);
			const limitedProjects = shuffledProjects.slice(0, 50);
			const parsedProjects = limitedProjects.map(project => projectSchema.parse(project));
			if (!parsedProjects) {
				return c.json({ error: 'サーバエラー' }, 500);
			}
			return c.json(parsedProjects, 200);
		} catch (error) {
			console.error('Error fetching projects:', error);
			return c.json({ error: 'サーバエラー' }, 500);
		}
	})
	.post('/',
		zValidator('json', createProjectSchema, (result, c) => {
			if (!result.success) {
				return c.json({ error: '無効な入力' }, 400);
			}
		}), async (c) => {
			const user = c.get('user');
			if (!user) {
				return c.json({ error: 'Unauthorized' }, 401);
			}
			const db = getDb({
				TURSO_DB_URL: c.env.TURSO_DB_URL,
				TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN
			});
			const { name, description, projectTag, seriousnessTag } = c.req.valid('json');
			const id = nanoid();
			try {
				await db.insert(projects).values({
					id,
					name,
					description,
					projectTag,
					seriousnessTag,
				});
				return c.json({ id, name, description, projectTag, seriousnessTag }, 201);
			} catch (error) {
				console.error('Error creating project:', error);
				return c.json({ error: 'サーバエラー' }, 500);
			}
		})
	.put('/:id',
		zValidator('json', createProjectSchema, (result, c) => {
			if (!result.success) {
				return c.json({ error: '無効な入力' }, 400);
			}
		}),
		async (c) => {
			const user = c.get('user');
			if (!user) {
				return c.json({ error: 'Unauthorized' }, 401);
			}
			const { id } = c.req.param();
			const { name, description, projectTag, seriousnessTag } = c.req.valid('json');
			const db = getDb({
				TURSO_DB_URL: c.env.TURSO_DB_URL,
				TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN
			});
			try {
				await db.update(projects).set({
					name,
					description,
					projectTag,
					seriousnessTag,
					updatedAt: new Date(),
				}).where(eq(projects.id, id));
				return c.json({ id, name, description, projectTag, seriousnessTag }, 200);
			} catch (error) {
				console.error('Error updating project:', error);
				return c.json({ error: 'サーバエラー' }, 500);
			}
		});

export type AppType = typeof _routes;

export default app;