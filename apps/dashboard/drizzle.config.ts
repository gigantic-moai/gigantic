import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://gigantic:gigantic_dev@localhost:5432/gigantic';

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl
  },
  verbose: true,
  strict: true
});
