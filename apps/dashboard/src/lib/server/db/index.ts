/**
 * DB 클라이언트 — DATABASE_URL 스킴으로 드라이버를 선택한다.
 *
 * - (미설정)          → null 반환: 인메모리 mock 엔진 단독 동작
 * - pglite://<경로>   → 내장 Postgres(PGlite). 경로 디렉터리에 저장, 'memory'면 휘발성
 * - postgres://...    → node-postgres 풀 (운영: docker compose의 Postgres 16)
 *
 * 연결 시 drizzle 마이그레이션(./drizzle)을 자동 적용한다.
 * 드라이버는 필요할 때만 동적 import — mock 모드에선 아무것도 로드하지 않는다.
 */
import { env } from '$env/dynamic/private';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

export type GiganticDb = PgDatabase<PgQueryResultHKT, typeof schema>;
export type StorageMode = 'memory' | 'pglite' | 'postgres';

export interface DbHandle {
	db: GiganticDb;
	mode: Exclude<StorageMode, 'memory'>;
}

const MIGRATIONS_FOLDER = 'drizzle';

async function connectPglite(path: string): Promise<DbHandle> {
	const { PGlite } = await import('@electric-sql/pglite');
	const { drizzle } = await import('drizzle-orm/pglite');
	const { migrate } = await import('drizzle-orm/pglite/migrator');
	if (path !== 'memory') {
		// PGlite는 상위 디렉터리를 만들어주지 않는다
		const { mkdirSync } = await import('node:fs');
		mkdirSync(path, { recursive: true });
	}
	const client = path === 'memory' ? new PGlite() : new PGlite(path);
	const db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
	return { db: db as unknown as GiganticDb, mode: 'pglite' };
}

async function connectPostgres(url: string): Promise<DbHandle> {
	const pgMod = await import('pg');
	const Pool = pgMod.default?.Pool ?? pgMod.Pool;
	const { drizzle } = await import('drizzle-orm/node-postgres');
	const { migrate } = await import('drizzle-orm/node-postgres/migrator');
	const pool = new Pool({ connectionString: url });
	const db = drizzle(pool, { schema });
	await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
	return { db: db as unknown as GiganticDb, mode: 'postgres' };
}

/** DATABASE_URL 기준으로 연결 + 마이그레이션. 미설정이면 null (mock 모드). */
export async function connectDb(): Promise<DbHandle | null> {
	const url = env.DATABASE_URL?.trim();
	if (!url) return null;
	if (url.startsWith('pglite://')) {
		return connectPglite(url.slice('pglite://'.length) || 'memory');
	}
	return connectPostgres(url);
}
