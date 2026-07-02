import type { IslandProfile, KnowledgeCategory } from '@gigantic/shared';
import { hashString } from './utils';

/**
 * 🏝️ 지식 구성 → 섬 프로필
 *
 * 섬은 프로젝트의 것이다. Gigantic 설치 시 전체 서밋 히스토리를 둘러보며
 * 지식이 축적되고, 축적이 완료되면 섬이 만들어진다. 이후 지식이 승인될 때마다 성장한다.
 * - 구현 패턴이 많으면 산이 높고 험준한 섬
 * - 에셋 매핑이 넓으면 넓고 평평한 섬
 * - 계약 지식이 풍부하면 다리와 항구가 많은 섬
 * - 변경 이력이 깊으면 지층이 보이는 섬
 */
export type IslandScale = Record<KnowledgeCategory, number>;

/** 프로젝트 규모 지식 총량 기준 스케일 (성장 여지를 남긴다) */
export const PROJECT_ISLAND_SCALE: IslandScale = {
	pattern: 48,
	'asset-mapping': 64,
	contract: 16,
	history: 48
};

export function islandFromKnowledge(
	seedKey: string,
	knowledge: Record<KnowledgeCategory, number>,
	scale: IslandScale = PROJECT_ISLAND_SCALE
): IslandProfile {
	const clamp = (v: number) => Math.max(0, Math.min(1, v));
	return {
		seed: hashString(seedKey),
		mountains: clamp(knowledge.pattern / scale.pattern),
		plains: clamp(knowledge['asset-mapping'] / scale['asset-mapping']),
		bridges: clamp(knowledge.contract / scale.contract),
		strata: clamp(knowledge.history / scale.history)
	};
}

export function islandDescription(p: IslandProfile): string {
	const parts: string[] = [];
	if (p.mountains > 0.55) parts.push('산이 높고 험준한');
	else if (p.mountains > 0.25) parts.push('언덕이 솟은');
	if (p.plains > 0.55) parts.push('넓고 평평한');
	if (p.bridges > 0.5) parts.push('다리와 항구가 많은');
	else if (p.bridges > 0.2) parts.push('항구가 놓인');
	if (p.strata > 0.5) parts.push('지층이 드러난');
	if (parts.length === 0) parts.push('이제 막 솟아난 작은');
	return parts.join(', ') + ' 섬';
}
