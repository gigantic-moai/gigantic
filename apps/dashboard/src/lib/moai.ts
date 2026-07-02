import type { MoaiTraits } from '@gigantic/shared';
import { seededRng } from './utils';

export const TRAIT_COUNTS = {
	stone: 6,
	faceWidth: 5,
	eyes: 6,
	mouth: 5,
	accessory: 6
} as const;

/** 시드에서 모아이 특성 조합을 결정적으로 생성 (§9.2) */
export function randomMoai(seed: number): MoaiTraits {
	const rng = seededRng(seed);
	return {
		stone: Math.floor(rng() * TRAIT_COUNTS.stone),
		faceWidth: Math.floor(rng() * TRAIT_COUNTS.faceWidth),
		eyes: Math.floor(rng() * TRAIT_COUNTS.eyes),
		mouth: Math.floor(rng() * TRAIT_COUNTS.mouth),
		accessory: Math.floor(rng() * TRAIT_COUNTS.accessory)
	};
}

export function moaiKey(t: MoaiTraits): string {
	return [t.stone, t.faceWidth, t.eyes, t.mouth, t.accessory].join('-');
}
