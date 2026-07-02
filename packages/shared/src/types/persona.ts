/** 모아이 아바타 프로시저럴 조합 — §9.1/§9.2
 *  돌 색상 6종 · 얼굴폭 5단계 · 눈 6종 · 입 5종 · 악세서리 6종 */
export interface MoaiTraits {
	/** 0–5 */
	stone: number;
	/** 0–4 */
	faceWidth: number;
	/** 0–5 */
	eyes: number;
	/** 0–4 */
	mouth: number;
	/** 0–5 */
	accessory: number;
}

export const MOAI_STONES = [
	{ id: 0, label: '따뜻한 돌', base: '#8a7561', shade: '#6d5b4a', light: '#a58e77' },
	{ id: 1, label: '차가운 회암', base: '#7d8490', shade: '#5f6570', light: '#99a0ac' },
	{ id: 2, label: '화산암', base: '#5c5450', shade: '#453f3c', light: '#746a65' },
	{ id: 3, label: '사암', base: '#b09468', shade: '#8e7550', light: '#c7ad83' },
	{ id: 4, label: '이끼 낀 돌', base: '#6e7a5e', shade: '#545e47', light: '#879377' },
	{ id: 5, label: '붉은 응회암', base: '#96604f', shade: '#74483a', light: '#b07a67' }
] as const;

export const MOAI_EYES = [
	'졸린 눈',
	'화난 눈',
	'동그란 눈',
	'가늘게 뜬 눈',
	'반짝이는 눈',
	'감은 눈'
] as const;

export const MOAI_MOUTHS = ['일자 입', '뿌루퉁', '미소', '놀란 입', '굳게 다문 입'] as const;

export const MOAI_ACCESSORIES = [
	'없음',
	'균열 흉터',
	'이끼',
	'화관',
	'모노클',
	'귀 장식'
] as const;

export const MOAI_FACE_WIDTHS = ['매우 좁음', '좁음', '보통', '넓음', '매우 넓음'] as const;

/** 페르소나 — §9.1 */
export interface Persona {
	name: string;
	/** 역할이 시스템 프롬프트의 전문 분야를 결정 */
	role: string;
	/** 작업 스타일과 톤 — 스크럼 로그에서 캐릭터성으로 드러남 */
	personality: string;
	/** 이슈 자동 할당 매칭 기준 */
	tags: string[];
	moai: MoaiTraits;
}
