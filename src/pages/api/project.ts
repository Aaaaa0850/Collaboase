import { Hono } from 'hono';
import { auth } from '../../lib/auth';
import { getDb } from '../../index';
import { projects } from '../../db/schema';
import { eq, and, gte } from 'drizzle-orm';
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
	.get('/:tag?/:seriousness?', async (c) => {
		const user = c.get('user');
		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}
		const db = getDb({
			TURSO_DB_URL: c.env.TURSO_DB_URL,
			TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN
		});
		const { tag, seriousness } = c.req.param();
		const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago

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
			return c.json(parsedProjects);
		} catch (error) {
			console.error('Error fetching projects:', error);
			return c.json({ error: 'サーバエラー' }, 500);
		}
	})
	.post('/',
		zValidator('json', createProjectSchema, (result, c) => {
			if (!result.success) {
				return c.text('Invalid!', 400)
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
				return c.json({ id, name, description, projectTag, seriousnessTag });
			} catch (error) {
				console.error('Error creating project:', error);
				return c.json({ error: 'サーバエラー' }, 500);
			}
		});

export type AppType = typeof _routes;

export default app;