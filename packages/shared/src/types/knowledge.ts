/** 지식의 네 가지 범주 — §6.2 */
export type KnowledgeCategory =
	| 'pattern' // 🔧 구현 패턴
	| 'asset-mapping' // 🗺️ 에셋 ↔ 시스템 매핑
	| 'contract' // 📜 시스템 간 계약
	| 'history'; // 📊 변경 이력 컨텍스트

export const KNOWLEDGE_CATEGORY_META: Record<
	KnowledgeCategory,
	{ label: string; emoji: string; source: string }
> = {
	pattern: {
		label: '구현 패턴',
		emoji: '🔧',
		source: 'P4 changeset diff 분석, 코드 정적 분석'
	},
	'asset-mapping': {
		label: '에셋 ↔ 시스템 매핑',
		emoji: '🗺️',
		source: 'P4 changeset description, 폴더 구조, 에셋 참조 그래프'
	},
	contract: {
		label: '시스템 간 계약',
		emoji: '📜',
		source: '인터페이스 정의 파일, Proto/IDL, 코드 분석'
	},
	history: {
		label: '변경 이력 컨텍스트',
		emoji: '📊',
		source: 'P4 changeset 로그, 작성자/날짜/설명 메타데이터'
	}
};

/** 사람의 승인을 거쳐야 정식 지식이 된다 — §6.1 */
export type KnowledgeStatus = 'pending' | 'approved' | 'rejected';

export interface KnowledgeEntry {
	id: string;
	category: KnowledgeCategory;
	title: string;
	body: string;
	tags: string[];
	/** 지식을 발견한 에이전트 (온보딩 자동 구축이면 없음) */
	sourceAgentId?: string;
	/** 지식의 근거가 된 P4 changelist */
	sourceChangelist?: number;
	status: KnowledgeStatus;
	createdAt: string;
	updatedAt: string;
}
