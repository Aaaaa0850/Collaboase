import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '../index';
import * as schema from '../db/schema';

interface Bindings {
	BETTER_AUTH_URL?: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	TURSO_DB_URL: string;
	TURSO_AUTH_TOKEN: string;
}

export const auth = (env: Bindings) => {
	const db = getDb({ TURSO_DB_URL: env.TURSO_DB_URL, TURSO_AUTH_TOKEN: env.TURSO_AUTH_TOKEN });
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification,
			}
		}),
		baseURL: env.BETTER_AUTH_URL || 'http://localhost:4321',
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
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
	});
};