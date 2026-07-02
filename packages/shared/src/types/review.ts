import type { ContractViolation } from './contracts';

/** P4 changelist 리뷰 상태 — RV-04 */
export type ChangelistStatus =
	| 'open' // 리뷰 대기
	| 'approved' // 승인 → 머지 큐
	| 'merged' // 메인에 머지 완료
	| 'rejected' // 반려 → 에이전트 재시도
	| 'changes-requested' // 수정 요청 → 부분 수정
	| 'blocked'; // 계약 위반으로 머지 차단 (§7.1)

export type DiffLineType = 'ctx' | 'add' | 'del';

export interface DiffLine {
	type: DiffLineType;
	text: string;
	oldNo?: number;
	newNo?: number;
}

export interface DiffHunk {
	header: string;
	lines: DiffLine[];
}

export type FileAction = 'edit' | 'add' | 'delete' | 'lock';

export interface FileDiff {
	path: string;
	action: FileAction;
	/** .uasset 등 바이너리 — diff 없이 배타적 잠금 정보만 표시 */
	binary?: boolean;
	hunks: DiffHunk[];
}

export type BuildStatus = 'pending' | 'running' | 'success' | 'failed';

/** P4 changelist — 리뷰창의 단위 (RV-01) */
export interface Changelist {
	id: string;
	/** P4 CL 번호 */
	number: number;
	agentId: string;
	issueId?: string;
	title: string;
	/** P4 CL description — 에이전트 로그 자동 부착 (RV-05) */
	description: string;
	agentLog: string[];
	status: ChangelistStatus;
	files: FileDiff[];
	/** 젠킨스 빌드 결과 — Gigantic은 읽기만 한다 (§11.3) */
	buildStatus: BuildStatus;
	contractViolations: ContractViolation[];
	/** ☀️ 트렁크 감시 자동 수정 CL (§11.2) */
	trunkFix?: boolean;
	createdAt: string;
}

/** 라인 단위 양방향 코멘트 — RV-02/RV-03 */
export interface ReviewComment {
	id: string;
	changelistId: string;
	/** 파일/라인이 없으면 CL 전체 코멘트 */
	filePath?: string;
	/** diff 내 newNo(add/ctx) 또는 oldNo(del) 기준 라인 번호 */
	line?: number;
	lineType?: DiffLineType;
	authorType: 'human' | 'agent';
	authorId?: string;
	authorName: string;
	body: string;
	parentId?: string;
	createdAt: string;
}
