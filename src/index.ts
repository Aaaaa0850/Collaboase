import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from './db/schema'

export const getDb = (env: { TURSO_DB_URL: string; TURSO_AUTH_TOKEN: string }) => {
	const client = createClient({
		url: env.TURSO_DB_URL,
		authToken: env.TURSO_AUTH_TOKEN,
	})
	const db = drizzle(client, { schema })
	return db
}