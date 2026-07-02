/**
 * 인메모리 mock 오케스트레이터 엔진.
 *
 * DATABASE_URL 없이 대시보드를 단독 실행할 때 브릿지/DB 역할을 대신한다.
 * globalThis 싱글턴이라 vite HMR/모듈 리로드에도 상태가 유지되고,
 * vite 플러그인이 붙여둔 WebSocket 클라이언트 집합으로 직접 브로드캐스트한다.
 */
import { env } from '$env/dynamic/private';
import type {
	Agent,
	AgentSchedule,
	Changelist,
	ContractEntry,
	GiganticSettings,
	Issue,
	IssueStatus,
	KnowledgeCategory,
	KnowledgeEntry,
	MergeRecord,
	Persona,
	ProjectState,
	ReviewComment,
	ScrumPost
} from '@gigantic/shared';
import { ONBOARDING_STEPS } from '@gigantic/shared';
import { islandFromKnowledge } from '$lib/island';
import { connectDb, type DbHandle, type StorageMode } from '../db';
import { loadState, persistAll } from '../db/store';
import {
	seedAgents,
	seedChangelists,
	seedComments,
	seedContracts,
	seedIssues,
	seedKnowledge,
	seedKpi,
	seedProject,
	seedScrum,
	seedSettings
} from './seed';

export interface EngineState {
	/** 환경설정 — 대시보드에서 관리, .env 값이 있으면 초기값으로 사용 */
	settings: GiganticSettings;
	/** 프로젝트 — 설치 시 전체 서밋 분석으로 지식이 축적되고 🏝️ 섬이 생성됨 */
	project: ProjectState;
	agents: Agent[];
	issues: Issue[];
	changelists: Changelist[];
	comments: ReviewComment[];
	knowledge: KnowledgeEntry[];
	contracts: ContractEntry[];
	scrum: ScrumPost[];
	kpi: {
		buildSuccessRate: number[];
		changelistsPerDay: number[];
		buildsToday: { total: number; failed: number };
		recentMerges: MergeRecord[];
	};
	seq: number;
}

/** 상태 스키마가 바뀌면 올린다 — HMR로 살아남은 구버전 싱글턴을 폐기 */
const ENGINE_VERSION = 6;

/** 시드에서 초기 엔진 상태를 만든다. .env 값이 있으면 초기 설정에 반영. */
export function buildSeedState(): EngineState {
	const project = structuredClone(seedProject);
	const settings = structuredClone(seedSettings);
	if (env.P4PORT) settings.p4.port = env.P4PORT;
	if (env.P4USER) settings.p4.user = env.P4USER;
	if (env.P4DEPOT) settings.p4.depot = env.P4DEPOT;
	if (env.DASHBOARD_PORT) settings.network.dashboardPort = Number(env.DASHBOARD_PORT);
	if (env.ORCHESTRATOR_PORT) settings.network.orchestratorPort = Number(env.ORCHESTRATOR_PORT);
	return {
		settings,
		project: {
			...project,
			island: islandFromKnowledge('gigantic-project', project.knowledge)
		},
		agents: structuredClone(seedAgents),
		issues: structuredClone(seedIssues),
		changelists: structuredClone(seedChangelists),
		comments: structuredClone(seedComments),
		knowledge: structuredClone(seedKnowledge),
		contracts: structuredClone(seedContracts),
		scrum: structuredClone(seedScrum),
		kpi: structuredClone(seedKpi),
		seq: 1000
	};
}

interface WsLike {
	readyState: number;
	send: (data: string) => void;
}

class Engine {
	state: EngineState;
	timer: ReturnType<typeof setInterval> | undefined;
	/** 영속화 대상 DB — null이면 인메모리 mock 모드 */
	private db: DbHandle | null;
	private persistTimer: ReturnType<typeof setTimeout> | undefined;

	get storageMode(): StorageMode {
		return this.db?.mode ?? 'memory';
	}

	constructor(db: DbHandle | null, state: EngineState) {
		this.db = db;
		this.state = state;
		this.timer = setInterval(() => this.tick(), 8000);
		// Node가 이 타이머 때문에 종료를 막지 않도록
		if (typeof this.timer === 'object' && 'unref' in this.timer) this.timer.unref();
	}

	/**
	 * 변경 스냅샷을 디바운스로 저장 — 데이터가 작아 전체 교체가 단순하고 안전하다.
	 * 실패해도 대시보드 동작은 계속된다(다음 변경에서 재시도).
	 */
	private schedulePersist() {
		if (!this.db) return;
		clearTimeout(this.persistTimer);
		this.persistTimer = setTimeout(() => {
			persistAll(this.db!.db, this.state).catch((err) =>
				console.error('[gigantic] DB 영속화 실패:', err)
			);
		}, 800);
		if (typeof this.persistTimer === 'object' && 'unref' in this.persistTimer)
			this.persistTimer.unref();
	}

	nextId(prefix: string): string {
		return `${prefix}-${++this.state.seq}`;
	}

	/* ── 브로드캐스트 ─────────────────────────────── */

	private sockets(): Set<WsLike> {
		const g = globalThis as Record<string, unknown>;
		return (g.__giganticSockets as Set<WsLike>) ?? new Set();
	}

	broadcast(payload: unknown) {
		const raw = JSON.stringify(payload);
		for (const ws of this.sockets()) {
			if (ws.readyState === 1) {
				try {
					ws.send(raw);
				} catch {
					/* 끊긴 소켓은 close 핸들러가 정리 */
				}
			}
		}
	}

	changed(scope: string) {
		this.broadcast({ type: 'state-changed', scope });
		this.schedulePersist();
	}

	heartbeat() {
		this.broadcast({
			type: 'heartbeat',
			agents: this.state.agents.map((a) => ({
				id: a.id,
				status: a.status,
				progress: a.progress,
				activity: a.activity
			}))
		});
	}

	/* ── 시뮬레이션 틱 ────────────────────────────── */

	private tick() {
		const now = new Date();
		let dirty = false;

		for (const agent of this.state.agents) {
			// 온보딩 자동 진행 — 돌 깎기 + 지식 학습, 단계 6(승인 대기) 직전까지
			if (agent.status === 'onboarding') {
				if (agent.onboarding.step < 5) {
					agent.onboarding.step += 1;
					// 학습 단계(3~5)부터 changeset을 정독한다
					if (agent.onboarding.step >= 3) {
						agent.onboarding.changesetsAnalyzed =
							(agent.onboarding.changesetsAnalyzed ?? 0) + Math.floor(120 + Math.random() * 300);
					}
					agent.activity = `온보딩 ${agent.onboarding.step}/7 — ${ONBOARDING_STEPS[agent.onboarding.step - 1]}`;
					dirty = true;
				} else {
					// 학습 완료 → 지식 요약 생성, 사람 승인 대기
					agent.onboarding.step = 6;
					agent.onboarding.summary = {
						pattern: 4 + Math.floor(Math.random() * 10),
						'asset-mapping': 6 + Math.floor(Math.random() * 18),
						contract: 1 + Math.floor(Math.random() * 6),
						history: 5 + Math.floor(Math.random() * 12)
					};
					agent.status = 'awaiting-approval';
					agent.activity = '지식 요약 승인 대기 — 대시보드에서 검토해 주세요';
					dirty = true;
				}
			}

			// 스케줄 기반 모드 전환 (§11)
			if (!['onboarding', 'awaiting-approval', 'paused'].includes(agent.status)) {
				const desired = this.desiredStatus(agent, now);
				if (agent.status !== desired) {
					agent.status = desired;
					if (desired === 'day-watch') agent.activity = 'main trunk 감시 중 — 젠킨스 상태 정상';
					if (desired === 'idle') agent.activity = '다음 스케줄 대기';
					dirty = true;
				}
			}

			// 야간 작업 진행률
			if (agent.status === 'night-work' && agent.currentIssueId) {
				agent.progress = Math.min(99, (agent.progress ?? 0) + Math.floor(Math.random() * 4));
			}
			agent.lastHeartbeat = now.toISOString();
		}

		if (dirty) this.changed('agents');
		this.heartbeat();
	}

	desiredStatus(agent: Agent, now: Date): Agent['status'] {
		const [nsH, nsM] = agent.schedule.nightStart.split(':').map(Number);
		const [neH, neM] = agent.schedule.nightEnd.split(':').map(Number);
		const cur = now.getHours() * 60 + now.getMinutes();
		const start = nsH * 60 + (nsM || 0);
		const end = neH * 60 + (neM || 0);
		const inNight = start > end ? cur >= start || cur < end : cur >= start && cur < end;

		if (inNight) return agent.currentIssueId ? 'night-work' : 'idle';
		const weekday = agent.schedule.weekdays.includes(now.getDay());
		if (weekday && agent.schedule.dayWatchEnabled) return 'day-watch';
		return 'idle';
	}

	/* ── 칸반 (D-2) ──────────────────────────────── */

	/** 전문 태그 매칭으로 담당 에이전트 자동 결정 — 겹치는 태그가 가장 많은 온보딩 완료 에이전트 */
	private autoAssign(tags: string[]): Agent | undefined {
		const lower = tags.map((t) => t.toLowerCase());
		const eligible = this.state.agents.filter(
			(a) => a.onboarding.step >= 7 && a.status !== 'paused'
		);
		let best: Agent | undefined;
		let bestScore = 0;
		for (const agent of eligible) {
			const score = agent.persona.tags.filter((t) => lower.includes(t.toLowerCase())).length;
			const load = this.state.issues.filter(
				(i) => i.assigneeId === agent.id && i.status !== 'done'
			).length;
			const bestLoad = best
				? this.state.issues.filter((i) => i.assigneeId === best!.id && i.status !== 'done').length
				: Infinity;
			if (score > bestScore || (score === bestScore && score > 0 && load < bestLoad)) {
				best = agent;
				bestScore = score;
			}
		}
		return bestScore > 0 ? best : undefined;
	}

	/** 열린 이슈와 .uasset 배타적 잠금이 겹치는 이슈 키 목록 (충돌 사전 분석) */
	private uassetConflicts(uassets: string[], excludeId?: string): string[] {
		if (uassets.length === 0) return [];
		return this.state.issues
			.filter(
				(i) =>
					i.id !== excludeId &&
					i.status !== 'done' &&
					i.uassets.some((u) => uassets.includes(u))
			)
			.map((i) => i.key);
	}

	addIssue(input: {
		title: string;
		description: string;
		priority: Issue['priority'];
		tags: string[];
		deps: string[];
		expectedFiles: string[];
		uassets: string[];
		assigneeId?: string; // 'auto' | 에이전트 id | undefined(미할당)
	}): { issue: Issue; autoAssigned?: string; conflicts: string[] } {
		const nextNum =
			Math.max(0, ...this.state.issues.map((i) => parseInt(i.key.match(/(\d+)$/)?.[1] ?? '0', 10))) + 1;
		let assigneeId = input.assigneeId;
		let autoAssigned: string | undefined;
		if (assigneeId === 'auto') {
			const agent = this.autoAssign(input.tags);
			assigneeId = agent?.id;
			autoAssigned = agent?.persona.name;
		}
		const now = new Date().toISOString();
		const issue: Issue = {
			id: this.nextId('i'),
			key: `GIG-${nextNum}`,
			title: input.title,
			description: input.description,
			priority: input.priority,
			tags: input.tags,
			deps: input.deps.filter((d) => this.state.issues.some((i) => i.id === d)),
			expectedFiles: input.expectedFiles,
			uassets: input.uassets,
			assigneeId,
			status: 'todo',
			createdAt: now,
			updatedAt: now
		};
		this.state.issues.push(issue);
		this.changed('issues');
		return { issue, autoAssigned, conflicts: this.uassetConflicts(issue.uassets, issue.id) };
	}

	updateIssue(
		id: string,
		patch: {
			title?: string;
			description?: string;
			priority?: Issue['priority'];
			tags?: string[];
			deps?: string[];
			expectedFiles?: string[];
			uassets?: string[];
			/** null = 미할당으로 변경, undefined = 변경 없음 */
			assigneeId?: string | null;
		}
	): { ok: boolean; conflicts: string[] } {
		const issue = this.state.issues.find((i) => i.id === id);
		if (!issue) return { ok: false, conflicts: [] };
		if (patch.title !== undefined) issue.title = patch.title;
		if (patch.description !== undefined) issue.description = patch.description;
		if (patch.priority !== undefined) issue.priority = patch.priority;
		if (patch.tags !== undefined) issue.tags = patch.tags;
		if (patch.expectedFiles !== undefined) issue.expectedFiles = patch.expectedFiles;
		if (patch.uassets !== undefined) issue.uassets = patch.uassets;
		if (patch.deps !== undefined) {
			issue.deps = patch.deps.filter((d) => d !== id && this.state.issues.some((i) => i.id === d));
		}
		if (patch.assigneeId !== undefined) {
			const next = patch.assigneeId ?? undefined;
			if (issue.assigneeId && issue.assigneeId !== next) {
				const prev = this.state.agents.find((a) => a.id === issue.assigneeId);
				if (prev?.currentIssueId === id) {
					prev.currentIssueId = undefined;
					prev.progress = undefined;
				}
			}
			issue.assigneeId = next;
		}
		issue.updatedAt = new Date().toISOString();
		this.changed('issues');
		return { ok: true, conflicts: this.uassetConflicts(issue.uassets, issue.id) };
	}

	deleteIssue(id: string): { ok: boolean; reason?: string } {
		const issue = this.state.issues.find((i) => i.id === id);
		if (!issue) return { ok: false, reason: '이슈를 찾을 수 없습니다' };
		if (issue.changelistId) {
			return { ok: false, reason: '연결된 changelist가 있는 이슈는 삭제할 수 없습니다 — 리뷰창에서 먼저 처리하세요' };
		}
		this.state.issues = this.state.issues.filter((i) => i.id !== id);
		for (const other of this.state.issues) {
			other.deps = other.deps.filter((d) => d !== id);
		}
		const agent = this.state.agents.find((a) => a.currentIssueId === id);
		if (agent) {
			agent.currentIssueId = undefined;
			agent.progress = undefined;
			agent.activity = '다음 스케줄 대기';
		}
		this.changed('issues');
		return { ok: true };
	}

	moveIssue(issueId: string, status: IssueStatus) {
		const issue = this.state.issues.find((i) => i.id === issueId);
		if (!issue) return;
		issue.status = status;
		issue.updatedAt = new Date().toISOString();
		if (status === 'in-progress' && issue.assigneeId) {
			const agent = this.state.agents.find((a) => a.id === issue.assigneeId);
			if (agent && !agent.currentIssueId) {
				agent.currentIssueId = issue.id;
				agent.progress = 0;
				agent.activity = `${issue.key} · 작업 시작`;
			}
		}
		this.changed('issues');
	}

	/* ── 리뷰 (RV-01~05) ─────────────────────────── */

	addComment(input: {
		changelistId: string;
		filePath?: string;
		line?: number;
		lineType?: ReviewComment['lineType'];
		body: string;
		authorName: string;
		parentId?: string;
	}): ReviewComment {
		const comment: ReviewComment = {
			id: this.nextId('rc'),
			changelistId: input.changelistId,
			filePath: input.filePath,
			line: input.line,
			lineType: input.lineType,
			authorType: 'human',
			authorName: input.authorName || 'PO',
			body: input.body,
			parentId: input.parentId,
			createdAt: new Date().toISOString()
		};
		this.state.comments.push(comment);
		this.changed('reviews');
		this.scheduleAgentReply(comment);
		return comment;
	}

	/** 양방향 코멘트(RV-03) — 사람 코멘트에 에이전트가 근거로 답한다 */
	private scheduleAgentReply(human: ReviewComment) {
		const cl = this.state.changelists.find((c) => c.id === human.changelistId);
		if (!cl) return;
		const agent = this.state.agents.find((a) => a.id === cl.agentId);
		if (!agent) return;
		const replies: Record<string, string> = {
			core: '확인했습니다. 해당 라인은 프로파일링 수치를 근거로 한 선택입니다 — 상세 수치를 CL 설명에 추가해 두었습니다. 다른 대안이 필요하면 반려 사유에 남겨 주세요.',
			optima:
				'좋은 포인트입니다. Insights 캡처 기준으로는 현재 구현이 가장 낮은 프레임 비용이었습니다. 요청 주시면 대안 구현의 벤치마크도 같이 첨부하겠습니다.',
			front:
				'디자이너 시안과의 일치를 우선한 구현입니다. 수정 요청 주시면 시안 검수 스크린샷과 함께 반영하겠습니다.',
			gameplay:
				'BP 호환성을 유지하기 위한 선택입니다. 디폴트 인자로 기존 블루프린트 호출부는 깨지지 않습니다. 우려되는 케이스가 있으면 알려주세요.',
			sage: '머티리얼 비용 관점의 근거를 정리해서 답변드리겠습니다.'
		};
		const body = replies[agent.id] ?? '피드백 확인했습니다. 다음 사이클에 반영하겠습니다.';
		const timer = setTimeout(() => {
			this.state.comments.push({
				id: this.nextId('rc'),
				changelistId: human.changelistId,
				filePath: human.filePath,
				line: human.line,
				lineType: human.lineType,
				authorType: 'agent',
				authorId: agent.id,
				authorName: agent.persona.name,
				body,
				parentId: human.parentId ?? human.id,
				createdAt: new Date().toISOString()
			});
			this.changed('reviews');
		}, 4000);
		if (typeof timer === 'object' && 'unref' in timer) timer.unref();
	}

	/** 승인/반려/수정 요청 (RV-04) */
	decide(changelistId: string, decision: 'approve' | 'reject' | 'request-changes'):
		| { ok: true }
		| { ok: false; reason: string } {
		const cl = this.state.changelists.find((c) => c.id === changelistId);
		if (!cl) return { ok: false, reason: 'changelist를 찾을 수 없습니다' };
		const agent = this.state.agents.find((a) => a.id === cl.agentId);
		const issue = cl.issueId ? this.state.issues.find((i) => i.id === cl.issueId) : undefined;

		if (decision === 'approve') {
			if (cl.contractViolations.some((v) => v.severity === 'block')) {
				return {
					ok: false,
					reason: '계약 위반(머지 차단)이 해결되지 않아 머지할 수 없습니다'
				};
			}
			cl.status = 'approved';
			this.changed('reviews');
			// 머지 시뮬레이션 — 승인 3초 후 메인 머지 + 통합 빌드 (PA-05)
			const timer = setTimeout(() => {
				cl.status = 'merged';
				if (issue) {
					issue.status = 'done';
					issue.updatedAt = new Date().toISOString();
				}
				if (agent) {
					agent.stats.issuesDone += 1;
					if (agent.currentIssueId === issue?.id) {
						agent.currentIssueId = undefined;
						agent.progress = undefined;
					}
				}
				this.state.kpi.recentMerges.unshift({
					changelistNumber: cl.number,
					title: cl.title,
					agentId: cl.agentId,
					mergedAt: new Date().toISOString(),
					buildStatus: 'success'
				});
				this.state.kpi.recentMerges = this.state.kpi.recentMerges.slice(0, 12);
				this.changed('reviews');
				this.broadcast({
					type: 'toast',
					message: `CL ${cl.number} 메인 머지 완료 — 통합 빌드 통과`,
					kind: 'ok'
				});
			}, 3000);
			if (typeof timer === 'object' && 'unref' in timer) timer.unref();
			return { ok: true };
		}

		if (decision === 'reject') {
			cl.status = 'rejected';
			if (issue) {
				issue.status = 'in-progress'; // 에이전트 재시도
				issue.updatedAt = new Date().toISOString();
			}
			if (agent) {
				agent.currentIssueId = issue?.id ?? agent.currentIssueId;
				agent.progress = 10;
				agent.activity = `${issue?.key ?? cl.title} · 반려 사유 반영해 재작업 중`;
			}
			this.changed('reviews');
			return { ok: true };
		}

		cl.status = 'changes-requested';
		if (agent) {
			agent.activity = `${issue?.key ?? cl.title} · 수정 요청 반영 중 (부분 수정)`;
		}
		this.changed('reviews');
		return { ok: true };
	}

	/* ── 지식 (§6) ───────────────────────────────── */

	setKnowledgeStatus(id: string, status: 'approved' | 'rejected') {
		const k = this.state.knowledge.find((e) => e.id === id);
		if (!k) return;
		k.status = status;
		k.updatedAt = new Date().toISOString();
		if (status === 'approved') {
			// 지식이 축적되면 🏝️ 프로젝트 섬이 성장한다
			this.state.project.knowledge[k.category] += 1;
			this.state.project.island = islandFromKnowledge(
				'gigantic-project',
				this.state.project.knowledge
			);
			if (k.sourceAgentId) {
				const agent = this.state.agents.find((a) => a.id === k.sourceAgentId);
				if (agent) agent.stats.knowledge[k.category] += 1; // 발견자 기여 집계
			}
		}
		this.changed('knowledge');
	}

	updateKnowledge(id: string, patch: { title?: string; body?: string; tags?: string[] }) {
		const k = this.state.knowledge.find((e) => e.id === id);
		if (!k) return;
		if (patch.title !== undefined) k.title = patch.title;
		if (patch.body !== undefined) k.body = patch.body;
		if (patch.tags !== undefined) k.tags = patch.tags;
		k.updatedAt = new Date().toISOString();
		this.changed('knowledge');
	}

	addKnowledge(input: {
		category: KnowledgeCategory;
		title: string;
		body: string;
		tags: string[];
	}): KnowledgeEntry {
		const entry: KnowledgeEntry = {
			id: this.nextId('k'),
			category: input.category,
			title: input.title,
			body: input.body,
			tags: input.tags,
			status: 'approved', // 사람이 직접 작성 → 즉시 정식 지식
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		this.state.knowledge.unshift(entry);
		this.changed('knowledge');
		return entry;
	}

	/* ── 스크럼 (§10) ────────────────────────────── */

	addScrumPost(input: { body: string; parentId?: string; authorName?: string }): ScrumPost {
		const mentions = [...input.body.matchAll(/@([\p{L}\p{N}_-]+)/gu)].map((m) => m[1]);
		const post: ScrumPost = {
			id: this.nextId('sp'),
			date: new Date().toISOString().slice(0, 10),
			authorType: 'human',
			authorName: input.authorName || 'PO',
			body: input.body,
			parentId: input.parentId,
			mentions,
			reactions: [],
			createdAt: new Date().toISOString()
		};
		this.state.scrum.push(post);
		this.changed('scrum');
		this.scheduleScrumReply(post);
		return post;
	}

	/** 멘션된 에이전트가 스크럼에서 답한다 */
	private scheduleScrumReply(post: ScrumPost) {
		const mentioned = this.state.agents.find((a) => post.mentions.includes(a.persona.name));
		if (!mentioned) return;
		const tone: Record<string, string> = {
			core: '확인. 수치로 정리해서 다음 스크럼에 보고하겠다.',
			optima: '확인했다. 프로파일 캡처 떠서 답한다 — 숫자 없이는 결론 안 낸다.',
			front: '확인! 시안 기준으로 검토해서 답글 남길게.',
			gameplay: '확인. BP 호환성까지 포함해서 검토해두겠다.',
			sage: '확인. 머티리얼 비용표와 함께 답하겠다.'
		};
		const timer = setTimeout(() => {
			this.state.scrum.push({
				id: this.nextId('sp'),
				date: new Date().toISOString().slice(0, 10),
				authorType: 'agent',
				authorId: mentioned.id,
				authorName: mentioned.persona.name,
				body: `@${post.authorName} ${tone[mentioned.id] ?? '확인했다.'}`,
				parentId: post.parentId ?? post.id,
				mentions: [post.authorName],
				reactions: [],
				createdAt: new Date().toISOString()
			});
			this.changed('scrum');
		}, 5000);
		if (typeof timer === 'object' && 'unref' in timer) timer.unref();
	}

	toggleReaction(postId: string, emoji: string, by: string) {
		const post = this.state.scrum.find((p) => p.id === postId);
		if (!post) return;
		let r = post.reactions.find((x) => x.emoji === emoji);
		if (!r) {
			r = { emoji, by: [] };
			post.reactions.push(r);
		}
		if (r.by.includes(by)) r.by = r.by.filter((b) => b !== by);
		else r.by.push(by);
		post.reactions = post.reactions.filter((x) => x.by.length > 0);
		this.changed('scrum');
	}

	/* ── 에이전트 (§9, §8, §11) ──────────────────── */

	spawnAgent(persona: Persona, schedule?: Partial<AgentSchedule>): Agent {
		const base = persona.name
			.toLowerCase()
			.replace(/[^a-z0-9가-힣]/g, '')
			.slice(0, 16);
		let id = base || `agent-${this.state.seq}`;
		let n = 2;
		while (this.state.agents.some((a) => a.id === id)) id = `${base}-${n++}`;

		const agent: Agent = {
			id,
			persona,
			status: 'onboarding',
			schedule: {
				nightStart: '19:00',
				nightEnd: '09:00',
				trunkWatchMinutes: 30,
				weekdays: [1, 2, 3, 4, 5],
				dayWatchEnabled: true,
				...schedule
			},
			onboarding: {
				step: 1,
				total: 7,
				startedAt: new Date().toISOString(),
				changesetsAnalyzed: 0
			},
			stats: {
				issuesDone: 0,
				changelists: 0,
				trunkFixes: 0,
				knowledge: { pattern: 0, 'asset-mapping': 0, contract: 0, history: 0 }
			},
			activity: `온보딩 1/7 — ${ONBOARDING_STEPS[0]}`,
			p4Workspace: `gigantic-ws-${id}`,
			spawnedAt: new Date().toISOString(),
			lastHeartbeat: new Date().toISOString()
		};
		this.state.agents.push(agent);
		this.changed('agents');
		return agent;
	}

	/** 온보딩 지식 요약 승인 → 🗿 모아이 완성 → 스폰 가능. 섬은 만들지 않는다 — 섬은 프로젝트의 것. */
	approveOnboarding(agentId: string): { ok: boolean } {
		const agent = this.state.agents.find((a) => a.id === agentId);
		if (!agent || agent.status !== 'awaiting-approval' || !agent.onboarding.summary)
			return { ok: false };
		const s = agent.onboarding.summary;
		agent.stats.knowledge = {
			pattern: s.pattern ?? 0,
			'asset-mapping': s['asset-mapping'] ?? 0,
			contract: s.contract ?? 0,
			history: s.history ?? 0
		};
		agent.onboarding.step = 7;
		agent.status = this.desiredStatus(agent, new Date());
		agent.activity = '온보딩 완료 — 🗿 모아이 완성, 스폰 가능 상태';
		this.state.scrum.push({
			id: this.nextId('sp'),
			date: new Date().toISOString().slice(0, 10),
			authorType: 'agent',
			authorId: agent.id,
			authorName: agent.persona.name,
			body: `돌에서 갓 깎여 나왔다. 지식 베이스와 changeset ${agent.onboarding.changesetsAnalyzed?.toLocaleString()}개를 읽었다. 잘 부탁한다. 🗿`,
			mentions: [],
			reactions: [{ emoji: '🗿', by: this.state.agents.filter((a) => a.id !== agent.id).map((a) => a.id) }],
			createdAt: new Date().toISOString()
		});
		this.changed('agents');
		this.changed('scrum');
		return { ok: true };
	}

	rejectOnboarding(agentId: string) {
		const agent = this.state.agents.find((a) => a.id === agentId);
		if (!agent) return;
		// 반려 → 분석 파이프라인 재실행
		agent.status = 'onboarding';
		agent.onboarding = {
			step: 1,
			total: 7,
			startedAt: new Date().toISOString(),
			changesetsAnalyzed: 0
		};
		agent.activity = '지식 요약 반려 — 파이프라인 재실행 중';
		this.changed('agents');
	}

	updateSchedule(agentId: string, schedule: AgentSchedule) {
		const agent = this.state.agents.find((a) => a.id === agentId);
		if (!agent) return;
		agent.schedule = schedule;
		if (!['onboarding', 'awaiting-approval', 'paused'].includes(agent.status)) {
			agent.status = this.desiredStatus(agent, new Date());
		}
		this.changed('agents');
	}

	/* ── 환경설정 ─────────────────────────────────── */

	updateSettings(patch: Partial<GiganticSettings>, apiKey?: string) {
		const s = this.state.settings;
		if (patch.p4) s.p4 = { ...s.p4, ...patch.p4 };
		if (patch.paths) s.paths = { ...s.paths, ...patch.paths };
		if (patch.ci) s.ci = { ...s.ci, ...patch.ci };
		if (patch.network) s.network = { ...s.network, ...patch.network };
		if (patch.theme) s.theme = { ...s.theme, ...patch.theme };
		if (patch.llm) {
			// apiKeySet은 서버가 결정 — 클라이언트 값은 무시
			s.llm = { ...s.llm, ...patch.llm, apiKeySet: s.llm.apiKeySet };
		}
		if (apiKey !== undefined && apiKey !== '') {
			// mock: 키 원문은 저장하지 않고 설정 여부만 기록 (실서비스는 서버 시크릿 스토어)
			s.llm.apiKeySet = true;
		}
		this.changed('settings');
	}

	togglePause(agentId: string) {
		const agent = this.state.agents.find((a) => a.id === agentId);
		if (!agent) return;
		if (agent.status === 'paused') {
			agent.status = this.desiredStatus(agent, new Date());
			agent.activity = '재개됨';
		} else if (!['onboarding', 'awaiting-approval'].includes(agent.status)) {
			agent.status = 'paused';
			agent.activity = '사람이 일시 정지함';
		}
		this.changed('agents');
	}
}

async function boot(): Promise<Engine> {
	let handle: DbHandle | null = null;
	try {
		handle = await connectDb();
	} catch (err) {
		console.error('[gigantic] DB 연결 실패 — 인메모리 mock 모드로 대체합니다:', err);
	}
	if (!handle) return new Engine(null, buildSeedState());

	const existing = await loadState(handle.db);
	if (existing) {
		console.log(`[gigantic] DB(${handle.mode})에서 상태 복원 완료`);
		return new Engine(handle, existing);
	}
	// 빈 DB — 시드 후 즉시 저장
	const state = buildSeedState();
	await persistAll(handle.db, state);
	console.log(`[gigantic] DB(${handle.mode}) 최초 시드 완료`);
	return new Engine(handle, state);
}

export async function getEngine(): Promise<Engine> {
	const g = globalThis as Record<string, unknown>;
	if (!g.__giganticEnginePromise || g.__giganticEngineVersion !== ENGINE_VERSION) {
		// HMR로 살아남은 구버전 엔진은 타이머를 멈추고 폐기
		const prev = g.__giganticEnginePromise as Promise<Engine> | undefined;
		prev?.then((e) => clearInterval(e.timer)).catch(() => {});
		g.__giganticEnginePromise = boot();
		g.__giganticEngineVersion = ENGINE_VERSION;
	}
	return g.__giganticEnginePromise as Promise<Engine>;
}
