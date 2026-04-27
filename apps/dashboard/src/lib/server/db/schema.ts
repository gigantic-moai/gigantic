import { relations, sql } from 'drizzle-orm';
import {
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

/* ────────────────────────────────────────────────────────
 * Enums
 * ────────────────────────────────────────────────────── */

export const agentStatusEnum = pgEnum('agent_status', [
  'onboarding',
  'idle',
  'working',
  'reviewing',
  'watching'
]);

export const issueStatusEnum = pgEnum('issue_status', [
  'todo',
  'in_progress',
  'review',
  'done'
]);

export const issuePriorityEnum = pgEnum('issue_priority', [
  'low',
  'medium',
  'high',
  'critical'
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'pending',
  'approved',
  'rejected',
  'changes_requested'
]);

export const reviewCommentAuthorEnum = pgEnum('review_comment_author', [
  'human',
  'agent'
]);

export const knowledgeCategoryEnum = pgEnum('knowledge_category', [
  'pattern',
  'asset_mapping',
  'contract',
  'history'
]);

export const knowledgeStatusEnum = pgEnum('knowledge_status', [
  'pending',
  'approved',
  'rejected'
]);

/* ────────────────────────────────────────────────────────
 * Tables
 * ────────────────────────────────────────────────────── */

export const personas = pgTable('personas', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 64 }).notNull(),
  role: varchar('role', { length: 128 }).notNull(),
  description: text('description').notNull(),
  avatarConfig: jsonb('avatar_config').notNull(),
  tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
  systemPrompt: text('system_prompt').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  personaId: uuid('persona_id')
    .notNull()
    .references(() => personas.id, { onDelete: 'cascade' }),
  status: agentStatusEnum('status').notNull().default('onboarding'),
  scheduleConfig: jsonb('schedule_config').notNull(),
  knowledgeSummary: jsonb('knowledge_summary'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const issues = pgTable('issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 32 }).notNull().unique(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description').notNull().default(''),
  status: issueStatusEnum('status').notNull().default('todo'),
  priority: issuePriorityEnum('priority').notNull().default('medium'),
  assignedAgentId: uuid('assigned_agent_id').references(() => agents.id, {
    onDelete: 'set null'
  }),
  dependsOn: uuid('depends_on').array(),
  p4Changelist: integer('p4_changelist'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  issueId: uuid('issue_id')
    .notNull()
    .references(() => issues.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  p4Changelist: integer('p4_changelist').notNull(),
  status: reviewStatusEnum('status').notNull().default('pending'),
  diffData: jsonb('diff_data'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const reviewComments = pgTable('review_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id')
    .notNull()
    .references(() => reviews.id, { onDelete: 'cascade' }),
  authorType: reviewCommentAuthorEnum('author_type').notNull(),
  authorAgentId: uuid('author_agent_id').references(() => agents.id, {
    onDelete: 'set null'
  }),
  filePath: varchar('file_path', { length: 1024 }).notNull(),
  lineNumber: integer('line_number').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const scrumEntries = pgTable('scrum_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  sessionDate: date('session_date').notNull(),
  content: text('content').notNull(),
  parentId: uuid('parent_id').references((): any => scrumEntries.id, {
    onDelete: 'cascade'
  }),
  reactions: jsonb('reactions'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const knowledgeEntries = pgTable('knowledge_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: knowledgeCategoryEnum('category').notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  content: text('content').notNull(),
  sourceChangelist: integer('source_changelist'),
  status: knowledgeStatusEnum('status').notNull().default('pending'),
  approvedBy: varchar('approved_by', { length: 128 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
});

/* ────────────────────────────────────────────────────────
 * Relations
 * ────────────────────────────────────────────────────── */

export const personaRelations = relations(personas, ({ many }) => ({
  agents: many(agents)
}));

export const agentRelations = relations(agents, ({ one, many }) => ({
  persona: one(personas, {
    fields: [agents.personaId],
    references: [personas.id]
  }),
  issues: many(issues),
  reviews: many(reviews),
  scrumEntries: many(scrumEntries)
}));

export const issueRelations = relations(issues, ({ one, many }) => ({
  assignedAgent: one(agents, {
    fields: [issues.assignedAgentId],
    references: [agents.id]
  }),
  reviews: many(reviews)
}));

export const reviewRelations = relations(reviews, ({ one, many }) => ({
  issue: one(issues, {
    fields: [reviews.issueId],
    references: [issues.id]
  }),
  agent: one(agents, {
    fields: [reviews.agentId],
    references: [agents.id]
  }),
  comments: many(reviewComments)
}));

export const reviewCommentRelations = relations(reviewComments, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewComments.reviewId],
    references: [reviews.id]
  }),
  authorAgent: one(agents, {
    fields: [reviewComments.authorAgentId],
    references: [agents.id]
  })
}));

export const scrumEntryRelations = relations(scrumEntries, ({ one, many }) => ({
  agent: one(agents, {
    fields: [scrumEntries.agentId],
    references: [agents.id]
  }),
  parent: one(scrumEntries, {
    fields: [scrumEntries.parentId],
    references: [scrumEntries.id],
    relationName: 'thread'
  }),
  replies: many(scrumEntries, { relationName: 'thread' })
}));

/* ────────────────────────────────────────────────────────
 * Inferred row types
 * ────────────────────────────────────────────────────── */

export type Persona = typeof personas.$inferSelect;
export type NewPersona = typeof personas.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type ReviewComment = typeof reviewComments.$inferSelect;
export type NewReviewComment = typeof reviewComments.$inferInsert;
export type ScrumEntry = typeof scrumEntries.$inferSelect;
export type NewScrumEntry = typeof scrumEntries.$inferInsert;
export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type NewKnowledgeEntry = typeof knowledgeEntries.$inferInsert;
