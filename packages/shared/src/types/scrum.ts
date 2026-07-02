/** 스크럼 로그 — 소설처럼 읽는 재미 (§10) */
export interface ScrumReaction {
	emoji: string;
	/** 리액션 남긴 에이전트 id 또는 'human:<이름>' */
	by: string[];
}

export interface ScrumPost {
	id: string;
	/** 스크럼 날짜 (YYYY-MM-DD) — 아침 스크럼 단위 그룹핑 */
	date: string;
	authorType: 'agent' | 'human';
	authorId?: string;
	authorName: string;
	body: string;
	/** 스레드 답글 대상 */
	parentId?: string;
	/** @에이전트명 멘션 */
	mentions: string[];
	reactions: ScrumReaction[];
	createdAt: string;
}
