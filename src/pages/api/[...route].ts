import { Hono } from "hono";
import { auth } from "../../lib/auth";
import type { APIRoute } from "astro";

const app = new Hono();

const routes = app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

export type AppType = typeof routes

export const ALL: APIRoute = async ({ request }) => {
	return app.fetch(request);
}