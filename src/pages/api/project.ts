import { Hono } from 'hono';
import { auth } from '../../lib/auth';
import { getDb } from '../../index';
import { projects } from '../../db/schema';
import { eq } from 'drizzle-orm';

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

const routes = app
	.get('/api/project', async (c) => {
		const user = c.get('user');
		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}
		const db = getDb({ TURSO_DB_URL: c.env.TURSO_DB_URL, TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN });
	});

export type AppType = typeof routes;

export default app;