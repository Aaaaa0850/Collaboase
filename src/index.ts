import "dotenv/config"
import { drizzle } from "drizzle-orm/libsql/web"
import { createClient } from "@libsql/client/web"
import * as schema from './db/schema'

const client = createClient({
	url: process.env.TURSO_DB_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN!,
})

export const db = drizzle({ client, schema })