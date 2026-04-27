import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://gigantic:gigantic_dev@localhost:5432/gigantic';

const migrationClient = postgres(databaseUrl, { max: 1 });

async function main() {
  console.log('🗿 Running migrations against', maskUrl(databaseUrl));
  await migrate(drizzle(migrationClient), {
    migrationsFolder: './drizzle'
  });
  console.log('✅ Migrations complete');
  await migrationClient.end();
}

function maskUrl(url: string): string {
  return url.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1***$3');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
