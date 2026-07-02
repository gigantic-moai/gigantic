/** 프로젝트 오버뷰 KPI — §5.2 */
export interface MergeRecord {
	changelistNumber: number;
	title: string;
	agentId: string;
	mergedAt: string;
	buildStatus: 'success' | 'failed';
}

export interface OverviewKpis {
	openIssues: number;
	activeAgents: number;
	totalAgents: number;
	/** 최근 7일 빌드 성공률(%) 시계열 */
	buildSuccessRate: number[];
	buildsToday: { total: number; failed: number };
	pendingReviews: number;
	pendingKnowledge: number;
	contractViolations: number;
	recentMerges: MergeRecord[];
	/** 최근 7일 서밋된 changelist 수 시계열 */
	changelistsPerDay: number[];
}
