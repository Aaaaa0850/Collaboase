import { betterAuth } from 'better-auth/minimal'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../index'
import * as schema from '../db/schema'

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
		}
	}),
	baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:4321',
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	session: {
		strategy: "jwt",
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60,
		},
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		disableSessionRefresh: true
	},
	account: {
		accountLinking: {
			enabled: false
		}
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false
	}
})