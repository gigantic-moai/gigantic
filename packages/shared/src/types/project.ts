import type { KnowledgeCategory } from './knowledge';

/**
 * 🏝️ 섬 — 에이전트가 아니라 프로젝트의 것.
 * Gigantic이 설치될 때 depot의 전체 서밋 히스토리를 둘러보며 지식을 축적하고,
 * 그 축적이 완료되면 섬이 만들어진다. 이후 지식이 승인될 때마다 섬이 성장한다.
 */
export interface IslandProfile {
	seed: number;
	/** 구현 패턴 → 산의 높이 */
	mountains: number;
	/** 에셋 매핑 → 섬의 넓이/평탄함 */
	plains: number;
	/** 계약 지식 → 다리와 항구 */
	bridges: number;
	/** 변경 이력 → 지층 */
	strata: number;
}

/** 설치 시 1회 수행되는 프로젝트 온보딩(전체 서밋 분석) 단계 */
export const PROJECT_ONBOARDING_STEPS = [
	'P4 changeset 히스토리 수집 — 전체 서밋',
	'구현 패턴 추출',
	'에셋 ↔ 시스템 매핑 구축',
	'시스템 간 계약 레지스트리 구축',
	'변경 이력 컨텍스트 생성',
	'지식 축적 완료',
	'🏝️ 섬 생성'
] as const;

export interface ProjectState {
	/** Gigantic 설치일 — 이때 전체 서밋 분석이 수행됐다 */
	installedAt: string;
	/** 설치 시 둘러본 전체 changeset 수 */
	changesetsAnalyzed: number;
	/** 축적된 지식 총량 (범주별) — 섬의 형태를 결정 */
	knowledge: Record<KnowledgeCategory, number>;
	/** 지식 축적 완료로 생성된 섬 */
	island: IslandProfile;
}
