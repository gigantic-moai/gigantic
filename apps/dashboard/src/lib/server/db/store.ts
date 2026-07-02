/**
 * 엔진 상태 ↔ DB 영속화.
 *
 * 데이터 규모가 작으므로(수십 행) 스냅샷 전체를 트랜잭션으로 교체 저장한다.
 * 저장은 엔진의 changed() 훅에서 디바운스되어 호출된다.
 */
import type { EngineState } from '../engine/state';
import type { GiganticDb } from './index';
import * as t from './schema';

const SINGLETON_IDS = ['settings', 'project', 'kpi', 'meta'] as const;

export async function persistAll(db: GiganticDb, state: EngineState): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.delete(t.agents);
		if (state.agents.length > 0) {
			await tx.insert(t.agents).values(
				state.agents.map((a) => ({
					id: a.id,
					persona: a.persona,
					status: a.status,
					schedule: a.schedule,
					onboarding: a.onboarding,
					stats: a.stats,
					currentIssueId: a.currentIssueId ?? null,
					progress: a.progress ?? null,
					activity: a.activity ?? null,
					p4Workspace: a.p4Workspace ?? null,
					spawnedAt: a.spawnedAt ?? null,
					lastHeartbeat: a.lastHeartbeat
				}))
			);
		}

		await tx.delete(t.issues);
		if (state.issues.length > 0) {
			await tx.insert(t.issues).values(
				state.issues.map((i) => ({
					id: i.id,
					key: i.key,
					title: i.title,
					description: i.description,
					tags: i.tags,
					assigneeId: i.assigneeId ?? null,
					status: i.status,
					priority: i.priority,
					deps: i.deps,
					expectedFiles: i.expectedFiles,
					uassets: i.uassets,
					changelistId: i.changelistId ?? null,
					trunkFix: i.trunkFix ?? null,
					createdAt: i.createdAt,
					updatedAt: i.updatedAt
				}))
			);
		}

		await tx.delete(t.changelists);
		if (state.changelists.length > 0) {
			await tx.insert(t.changelists).values(
				state.changelists.map((c) => ({
					id: c.id,
					number: c.number,
					agentId: c.agentId,
					issueId: c.issueId ?? null,
					title: c.title,
					description: c.description,
					agentLog: c.agentLog,
					status: c.status,
					files: c.files,
					buildStatus: c.buildStatus,
					contractViolations: c.contractViolations,
					trunkFix: c.trunkFix ?? null,
					createdAt: c.createdAt
				}))
			);
		}

		await tx.delete(t.reviewComments);
		if (state.comments.length > 0) {
			await tx.insert(t.reviewComments).values(
				state.comments.map((c) => ({
					id: c.id,
					changelistId: c.changelistId,
					filePath: c.filePath ?? null,
					line: c.line ?? null,
					lineType: c.lineType ?? null,
					authorType: c.authorType,
					authorId: c.authorId ?? null,
					authorName: c.authorName,
					body: c.body,
					parentId: c.parentId ?? null,
					createdAt: c.createdAt
				}))
			);
		}

		await tx.delete(t.knowledgeEntries);
		if (state.knowledge.length > 0) {
			await tx.insert(t.knowledgeEntries).values(
				state.knowledge.map((k) => ({
					id: k.id,
					category: k.category,
					title: k.title,
					body: k.body,
					tags: k.tags,
					sourceAgentId: k.sourceAgentId ?? null,
					sourceChangelist: k.sourceChangelist ?? null,
					status: k.status,
					createdAt: k.createdAt,
					updatedAt: k.updatedAt
				}))
			);
		}

		await tx.delete(t.contractEntries);
		if (state.contracts.length > 0) {
			await tx.insert(t.contractEntries).values(
				state.contracts.map((c) => ({
					id: c.id,
					boundary: c.boundary,
					name: c.name,
					signature: c.signature,
					file: c.file,
					counterparts: c.counterparts,
					external: c.external ?? null
				}))
			);
		}

		await tx.delete(t.scrumPosts);
		if (state.scrum.length > 0) {
			await tx.insert(t.scrumPosts).values(
				state.scrum.map((p) => ({
					id: p.id,
					date: p.date,
					authorType: p.authorType,
					authorId: p.authorId ?? null,
					authorName: p.authorName,
					body: p.body,
					parentId: p.parentId ?? null,
					mentions: p.mentions,
					reactions: p.reactions,
					createdAt: p.createdAt
				}))
			);
		}

		await tx.delete(t.singletons);
		await tx.insert(t.singletons).values([
			{ id: 'settings', data: state.settings },
			{ id: 'project', data: state.project },
			{ id: 'kpi', data: state.kpi },
			{ id: 'meta', data: { seq: state.seq } }
		]);
	});
}

/** DB에서 엔진 상태 복원. 시드된 적이 없으면(메타 없음) null. */
export async function loadState(db: GiganticDb): Promise<EngineState | null> {
	const singles = await db.select().from(t.singletons);
	const byId = new Map(singles.map((s) => [s.id, s.data]));
	if (!SINGLETON_IDS.every((id) => byId.has(id))) return null;

	const [agents, issues, changelists, comments, knowledge, contracts, scrum] = await Promise.all([
		db.select().from(t.agents),
		db.select().from(t.issues),
		db.select().from(t.changelists),
		db.select().from(t.reviewComments),
		db.select().from(t.knowledgeEntries),
		db.select().from(t.contractEntries),
		db.select().from(t.scrumPosts)
	]);

	const opt = <T>(v: T | null): T | undefined => v ?? undefined;

	return {
		settings: byId.get('settings') as EngineState['settings'],
		project: byId.get('project') as EngineState['project'],
		kpi: byId.get('kpi') as EngineState['kpi'],
		seq: (byId.get('meta') as { seq: number }).seq,
		agents: agents.map((a) => ({
			id: a.id,
			persona: a.persona,
			status: a.status,
			schedule: a.schedule,
			onboarding: a.onboarding,
			stats: a.stats,
			currentIssueId: opt(a.currentIssueId),
			progress: opt(a.progress),
			activity: opt(a.activity),
			p4Workspace: opt(a.p4Workspace),
			spawnedAt: opt(a.spawnedAt),
			lastHeartbeat: a.lastHeartbeat
		})),
		issues: issues.map((i) => ({
			id: i.id,
			key: i.key,
			title: i.title,
			description: i.description,
			tags: i.tags,
			assigneeId: opt(i.assigneeId),
			status: i.status,
			priority: i.priority,
			deps: i.deps,
			expectedFiles: i.expectedFiles,
			uassets: i.uassets,
			changelistId: opt(i.changelistId),
			trunkFix: opt(i.trunkFix),
			createdAt: i.createdAt,
			updatedAt: i.updatedAt
		})),
		changelists: changelists.map((c) => ({
			id: c.id,
			number: c.number,
			agentId: c.agentId,
			issueId: opt(c.issueId),
			title: c.title,
			description: c.description,
			agentLog: c.agentLog,
			status: c.status,
			files: c.files,
			buildStatus: c.buildStatus,
			contractViolations: c.contractViolations,
			trunkFix: opt(c.trunkFix),
			createdAt: c.createdAt
		})),
		comments: comments.map((c) => ({
			id: c.id,
			changelistId: c.changelistId,
			filePath: opt(c.filePath),
			line: opt(c.line),
			lineType: opt(c.lineType),
			authorType: c.authorType,
			authorId: opt(c.authorId),
			authorName: c.authorName,
			body: c.body,
			parentId: opt(c.parentId),
			createdAt: c.createdAt
		})),
		knowledge: knowledge.map((k) => ({
			id: k.id,
			category: k.category,
			title: k.title,
			body: k.body,
			tags: k.tags,
			sourceAgentId: opt(k.sourceAgentId),
			sourceChangelist: opt(k.sourceChangelist),
			status: k.status,
			createdAt: k.createdAt,
			updatedAt: k.updatedAt
		})),
		contracts: contracts.map((c) => ({
			id: c.id,
			boundary: c.boundary,
			name: c.name,
			signature: c.signature,
			file: c.file,
			counterparts: c.counterparts,
			external: opt(c.external)
		})),
		scrum: scrum.map((p) => ({
			id: p.id,
			date: p.date,
			authorType: p.authorType,
			authorId: opt(p.authorId),
			authorName: p.authorName,
			body: p.body,
			parentId: opt(p.parentId),
			mentions: p.mentions,
			reactions: p.reactions,
			createdAt: p.createdAt
		}))
	};
}
