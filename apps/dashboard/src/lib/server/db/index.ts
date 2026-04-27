import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema.js';

const databaseUrl =
  env.DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://gigantic:gigantic_dev@localhost:5432/gigantic';

export const queryClient = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 30
});

export const db = drizzle(queryClient, { schema });

export type DB = typeof db;
export { schema };
