/** 칸반 컬럼 — To Do → In Progress → Review → Done (§5.2) */
export type IssueStatus = 'todo' | 'in-progress' | 'review' | 'done';

export type IssuePriority = 'p0' | 'p1' | 'p2';

export interface Issue {
	id: string;
	/** 표시용 키, 예: GIG-12 */
	key: string;
	title: string;
	description: string;
	/** 페르소나 전문 태그와 매칭되어 자동 할당(§9.1) */
	tags: string[];
	assigneeId?: string;
	status: IssueStatus;
	priority: IssuePriority;
	/** 워터폴 보드 의존성 — 이 이슈가 의존하는 이슈 id (§5.2) */
	deps: string[];
	/** 충돌 사전 분석용 변경 예상 파일 (PA-03) */
	expectedFiles: string[];
	/** 배타적 잠금 대상 .uasset — 같은 파일을 건드리는 이슈는 직렬화 */
	uassets: string[];
	/** 연결된 P4 changelist */
	changelistId?: string;
	/** ☀️ 주간 트렁크 감시가 만든 자동 수정 이슈 */
	trunkFix?: boolean;
	createdAt: string;
	updatedAt: string;
}
