CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"persona" jsonb NOT NULL,
	"status" text NOT NULL,
	"schedule" jsonb NOT NULL,
	"onboarding" jsonb NOT NULL,
	"stats" jsonb NOT NULL,
	"current_issue_id" text,
	"progress" integer,
	"activity" text,
	"p4_workspace" text,
	"spawned_at" text,
	"last_heartbeat" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "changelists" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"agent_id" text NOT NULL,
	"issue_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"agent_log" jsonb NOT NULL,
	"status" text NOT NULL,
	"files" jsonb NOT NULL,
	"build_status" text NOT NULL,
	"contract_violations" jsonb NOT NULL,
	"trunk_fix" boolean,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"boundary" text NOT NULL,
	"name" text NOT NULL,
	"signature" text NOT NULL,
	"file" text NOT NULL,
	"counterparts" jsonb NOT NULL,
	"external" boolean
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"tags" jsonb NOT NULL,
	"assignee_id" text,
	"status" text NOT NULL,
	"priority" text NOT NULL,
	"deps" jsonb NOT NULL,
	"expected_files" jsonb NOT NULL,
	"uassets" jsonb NOT NULL,
	"changelist_id" text,
	"trunk_fix" boolean,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"tags" jsonb NOT NULL,
	"source_agent_id" text,
	"source_changelist" integer,
	"status" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"changelist_id" text NOT NULL,
	"file_path" text,
	"line" integer,
	"line_type" text,
	"author_type" text NOT NULL,
	"author_id" text,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"parent_id" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrum_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"author_type" text NOT NULL,
	"author_id" text,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"parent_id" text,
	"mentions" jsonb NOT NULL,
	"reactions" jsonb NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "singletons" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
