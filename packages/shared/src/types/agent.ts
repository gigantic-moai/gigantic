import type { Persona } from './persona';
import type { KnowledgeCategory } from './knowledge';

/** 에이전트 상태 — §11 라이프사이클 */
export type AgentStatus =
	| 'onboarding' // §8 자동 학습 파이프라인 진행 중
	| 'awaiting-approval' // 지식 요약 사람 승인 대기
	| 'idle' // 스폰 가능 / 다음 스케줄 대기
	| 'night-work' // 🌙 야간 모드 — 이슈 작업
	| 'day-watch' // ☀️ 주간 모드 — 트렁크 감시
	| 'paused'; // 사람이 일시 정지

/** 에이전트 스케줄 — 스폰은 한 번, 이후는 자율 운영(§1.4) */
export interface AgentSchedule {
	/** 야간 모드 시작 "19:00" */
	nightStart: string;
	/** 야간 모드 종료 "09:00" */
	nightEnd: string;
	/** 주간 트렁크 감시 주기 (분) */
	trunkWatchMinutes: number;
	/** 주간 감시 활성 요일 (0=일 … 6=토) */
	weekdays: number[];
	/** 주간 트렁크 감시 활성화 여부 */
	dayWatchEnabled: boolean;
}

/**
 * 에이전트 온보딩 단계 — 모아이는 돌이 깎여서 생성된다.
 * 섬은 여기서 만들어지지 않는다(섬은 설치 시 전체 서밋 분석으로 생성되는 프로젝트의 것).
 * 조각이 끝나면 프로젝트에 축적된 지식을 학습하고, 사람 승인 후 작업을 시작한다.
 */
export const ONBOARDING_STEPS = [
	'채석장에서 돌 선별',
	'🗿 모아이 조각 — 돌 깎기',
	'프로젝트 지식 베이스 학습',
	'전문 태그 영역 changeset 정독',
	'계약 레지스트리 숙지',
	'지식 요약 → 사람 승인 대기',
	'🗿 모아이 완성 → 스폰 가능'
] as const;

export interface OnboardingState {
	/** 0 = 시작 전, 1–7 = 진행 단계(1-based, 완료된 단계 수) */
	step: number;
	total: number;
	startedAt?: string;
	/** 학습 완료 후 생성 — 사람 승인 대상 지식 요약 */
	summary?: Partial<Record<KnowledgeCategory, number>>;
	/** 학습하며 정독한 changeset 수 */
	changesetsAnalyzed?: number;
}

export interface AgentStats {
	issuesDone: number;
	changelists: number;
	trunkFixes: number;
	knowledge: Record<KnowledgeCategory, number>;
}

export interface Agent {
	id: string;
	persona: Persona;
	status: AgentStatus;
	schedule: AgentSchedule;
	onboarding: OnboardingState;
	stats: AgentStats;
	/** 현재 작업 중인 이슈 */
	currentIssueId?: string;
	/** 현재 작업 진행률 0–100 */
	progress?: number;
	/** 현재 하고 있는 일 한 줄 */
	activity?: string;
	/** P4 워크스페이스 이름 (PA-01) */
	p4Workspace?: string;
	spawnedAt?: string;
	lastHeartbeat: string;
}
