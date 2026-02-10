import { connect } from '@tidbcloud/serverless';
import { drizzle } from 'drizzle-orm/tidb-serverless';

const client = connect({ url: process.env.DATABASE_URL! });
export const db = drizzle({ client: client });
