/**
 * Drizzle ORM 스키마 (PostgreSQL 16)
 *
 * DATABASE_URL이 설정되면 엔진 상태가 이 스키마로 영속화된다.
 * - postgres://...  → 운영: node-postgres (docker compose의 Postgres 16)
 * - pglite://<경로> → 개발: 내장 Postgres(PGlite), 파일 디렉터리에 저장
 * DATABASE_URL이 없으면 인메모리 mock 엔진으로만 동작한다.
 *
 * 시각 컬럼은 ISO 8601 문자열(text)로 저장한다 — 엔진/클라이언트가 ISO 문자열을
 * 그대로 쓰므로 드라이버별 timezone 변환 오차를 없애기 위함.
 */
import { boolean, integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import type {
	AgentSchedule,
	AgentStats,
	AgentStatus,
	BuildStatus,
	ChangelistStatus,
	ContractBoundary,
	ContractViolation,
	DiffLineType,
	FileDiff,
	IssuePriority,
	IssueStatus,
	KnowledgeCategory,
	KnowledgeStatus,
	OnboardingState,
	Persona,
	ScrumReaction
} from '@gigantic/shared';

export const agents = pgTable('agents', {
	id: text('id').primaryKey(),
	persona: jsonb('persona').$type<Persona>().notNull(),
	status: text('status').$type<AgentStatus>().notNull(),
	schedule: jsonb('schedule').$type<AgentSchedule>().notNull(),
	onboarding: jsonb('onboarding').$type<OnboardingState>().notNull(),
	stats: jsonb('stats').$type<AgentStats>().notNull(),
	currentIssueId: text('current_issue_id'),
	progress: integer('progress'),
	activity: text('activity'),
	p4Workspace: text('p4_workspace'),
	spawnedAt: text('spawned_at'),
	lastHeartbeat: text('last_heartbeat').notNull()
});

export const issues = pgTable('issues', {
	id: text('id').primaryKey(),
	key: text('key').notNull(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	tags: jsonb('tags').$type<string[]>().notNull(),
	assigneeId: text('assignee_id'),
	status: text('status').$type<IssueStatus>().notNull(),
	priority: text('priority').$type<IssuePriority>().notNull(),
	deps: jsonb('deps').$type<string[]>().notNull(),
	expectedFiles: jsonb('expected_files').$type<string[]>().notNull(),
	uassets: jsonb('uassets').$type<string[]>().notNull(),
	changelistId: text('changelist_id'),
	trunkFix: boolean('trunk_fix'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

export const changelists = pgTable('changelists', {
	id: text('id').primaryKey(),
	number: integer('number').notNull(),
	agentId: text('agent_id').notNull(),
	issueId: text('issue_id'),
	title: text('title').notNull(),
	description: text('description').notNull(),
	agentLog: jsonb('agent_log').$type<string[]>().notNull(),
	status: text('status').$type<ChangelistStatus>().notNull(),
	files: jsonb('files').$type<FileDiff[]>().notNull(),
	buildStatus: text('build_status').$type<BuildStatus>().notNull(),
	contractViolations: jsonb('contract_violations').$type<ContractViolation[]>().notNull(),
	trunkFix: boolean('trunk_fix'),
	createdAt: text('created_at').notNull()
});

export const reviewComments = pgTable('review_comments', {
	id: text('id').primaryKey(),
	changelistId: text('changelist_id').notNull(),
	filePath: text('file_path'),
	line: integer('line'),
	lineType: text('line_type').$type<DiffLineType>(),
	authorType: text('author_type').$type<'human' | 'agent'>().notNull(),
	authorId: text('author_id'),
	authorName: text('author_name').notNull(),
	body: text('body').notNull(),
	parentId: text('parent_id'),
	createdAt: text('created_at').notNull()
});

export const knowledgeEntries = pgTable('knowledge_entries', {
	id: text('id').primaryKey(),
	category: text('category').$type<KnowledgeCategory>().notNull(),
	title: text('title').notNull(),
	body: text('body').notNull(),
	tags: jsonb('tags').$type<string[]>().notNull(),
	sourceAgentId: text('source_agent_id'),
	sourceChangelist: integer('source_changelist'),
	status: text('status').$type<KnowledgeStatus>().notNull(),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

export const contractEntries = pgTable('contract_entries', {
	id: text('id').primaryKey(),
	boundary: text('boundary').$type<ContractBoundary>().notNull(),
	name: text('name').notNull(),
	signature: text('signature').notNull(),
	file: text('file').notNull(),
	counterparts: jsonb('counterparts').$type<string[]>().notNull(),
	external: boolean('external')
});

export const scrumPosts = pgTable('scrum_posts', {
	id: text('id').primaryKey(),
	date: text('date').notNull(),
	authorType: text('author_type').$type<'agent' | 'human'>().notNull(),
	authorId: text('author_id'),
	authorName: text('author_name').notNull(),
	body: text('body').notNull(),
	parentId: text('parent_id'),
	mentions: jsonb('mentions').$type<string[]>().notNull(),
	reactions: jsonb('reactions').$type<ScrumReaction[]>().notNull(),
	createdAt: text('created_at').notNull()
});

/** 단건 상태 저장 — settings · project · kpi · meta(seq) */
export const singletons = pgTable('singletons', {
	id: text('id').primaryKey(),
	data: jsonb('data').notNull()
});
