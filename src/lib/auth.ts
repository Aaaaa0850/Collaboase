import { betterAuth } from 'better-auth/minimal'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../index'

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'mysql'
	}),
	baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:4321',
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60,
			strategy: "compact"
		},
		disableSessionRefresh: true
	}
})