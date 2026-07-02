/**
 * Drizzle ORM 스키마 (PostgreSQL 16) — §5.1/§13
 *
 * DATABASE_URL이 설정되면 이 스키마로 영속화하고, 없으면 인메모리 mock 엔진
 * (src/lib/server/engine)이 동일한 형태의 데이터를 제공한다.
 */
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar
} from 'drizzle-orm/pg-core';

export const agents = pgTable('agents', {
	id: varchar('id', { length: 40 }).primaryKey(),
	persona: jsonb('persona').notNull(),
	status: varchar('status', { length: 24 }).notNull(),
	schedule: jsonb('schedule').notNull(),
	onboarding: jsonb('onboarding').notNull(),
	island: jsonb('island'),
	stats: jsonb('stats').notNull(),
	currentIssueId: varchar('current_issue_id', { length: 40 }),
	p4Workspace: varchar('p4_workspace', { length: 120 }),
	spawnedAt: timestamp('spawned_at', { withTimezone: true }),
	lastHeartbeat: timestamp('last_heartbeat', { withTimezone: true }).notNull()
});

export const issues = pgTable('issues', {
	id: varchar('id', { length: 40 }).primaryKey(),
	key: varchar('key', { length: 20 }).notNull(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	tags: jsonb('tags').notNull(),
	assigneeId: varchar('assignee_id', { length: 40 }),
	status: varchar('status', { length: 20 }).notNull(),
	priority: varchar('priority', { length: 4 }).notNull(),
	deps: jsonb('deps').notNull(),
	expectedFiles: jsonb('expected_files').notNull(),
	uassets: jsonb('uassets').notNull(),
	changelistId: varchar('changelist_id', { length: 40 }),
	trunkFix: boolean('trunk_fix').default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull()
});

export const changelists = pgTable('changelists', {
	id: varchar('id', { length: 40 }).primaryKey(),
	number: integer('number').notNull(),
	agentId: varchar('agent_id', { length: 40 }).notNull(),
	issueId: varchar('issue_id', { length: 40 }),
	title: text('title').notNull(),
	description: text('description').notNull(),
	agentLog: jsonb('agent_log').notNull(),
	status: varchar('status', { length: 24 }).notNull(),
	files: jsonb('files').notNull(),
	buildStatus: varchar('build_status', { length: 12 }).notNull(),
	contractViolations: jsonb('contract_violations').notNull(),
	trunkFix: boolean('trunk_fix').default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
});

export const reviewComments = pgTable('review_comments', {
	id: serial('id').primaryKey(),
	changelistId: varchar('changelist_id', { length: 40 }).notNull(),
	filePath: text('file_path'),
	line: integer('line'),
	lineType: varchar('line_type', { length: 4 }),
	authorType: varchar('author_type', { length: 8 }).notNull(),
	authorId: varchar('author_id', { length: 40 }),
	authorName: varchar('author_name', { length: 80 }).notNull(),
	body: text('body').notNull(),
	parentId: integer('parent_id'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
});

export const knowledgeEntries = pgTable('knowledge_entries', {
	id: varchar('id', { length: 40 }).primaryKey(),
	category: varchar('category', { length: 20 }).notNull(),
	title: text('title').notNull(),
	body: text('body').notNull(),
	tags: jsonb('tags').notNull(),
	sourceAgentId: varchar('source_agent_id', { length: 40 }),
	sourceChangelist: integer('source_changelist'),
	status: varchar('status', { length: 12 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull()
});

export const contractEntries = pgTable('contract_entries', {
	id: varchar('id', { length: 40 }).primaryKey(),
	boundary: varchar('boundary', { length: 20 }).notNull(),
	name: text('name').notNull(),
	signature: text('signature').notNull(),
	file: text('file').notNull(),
	counterparts: jsonb('counterparts').notNull(),
	external: boolean('external').default(false)
});

export const scrumPosts = pgTable('scrum_posts', {
	id: varchar('id', { length: 40 }).primaryKey(),
	date: varchar('date', { length: 10 }).notNull(),
	authorType: varchar('author_type', { length: 8 }).notNull(),
	authorId: varchar('author_id', { length: 40 }),
	authorName: varchar('author_name', { length: 80 }).notNull(),
	body: text('body').notNull(),
	parentId: varchar('parent_id', { length: 40 }),
	mentions: jsonb('mentions').notNull(),
	reactions: jsonb('reactions').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
});
