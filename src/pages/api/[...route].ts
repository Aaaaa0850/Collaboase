import { Hono } from "hono";
import { auth } from "../../lib/auth";
import type { APIRoute } from "astro";
import project from "./project";

interface Bindings {
	BETTER_AUTH_URL?: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	TURSO_DB_URL: string;
	TURSO_AUTH_TOKEN: string;
}

interface Variables {
	user: ReturnType<typeof auth>['$Infer']['Session']['user'] | null;
	session: ReturnType<typeof auth>['$Infer']['Session']['session'] | null;
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

const _routes = app
	.on(["POST", "GET"], "/api/auth/*", (c) => {
		return auth(c.env).handler(c.req.raw);
	})
	.use("*", async (c, next) => {
		const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
		if (!session) {
			c.set("user", null);
			c.set("session", null);
			await next();
			return;
		}
		c.set("user", session.user);
		c.set("session", session.session);
		await next();
	})
	.route("/api/project", project);

export type AppType = typeof _routes

export const ALL: APIRoute = async ({ request }) => {
	return app.fetch(request);
}