/** 계약이 존재하는 네 가지 경계 — §7.2 */
export type ContractBoundary =
	| 'client-web' // 게임 클라 ↔ 웹 서버
	| 'client-dedi' // 게임 클라 ↔ 데디서버
	| 'dedi-backend' // 데디서버 ↔ 백엔드
	| 'client-sdk'; // 클라 ↔ 플랫폼 SDK

export const CONTRACT_BOUNDARY_META: Record<
	ContractBoundary,
	{ label: string; form: string }
> = {
	'client-web': {
		label: '게임 클라 ↔ 웹 서버',
		form: 'REST/GraphQL API 스키마, 요청/응답 DTO'
	},
	'client-dedi': {
		label: '게임 클라 ↔ 데디서버',
		form: 'RPC 시그니처, 리플리케이션 프로퍼티, 패킷 구조'
	},
	'dedi-backend': {
		label: '데디서버 ↔ 백엔드',
		form: '매치메이킹 API, 세션 관리, 인증 토큰 형식'
	},
	'client-sdk': {
		label: '클라 ↔ 플랫폼 SDK',
		form: '스팀/콘솔 SDK 콜백 시그니처, 업적/리더보드 ID'
	}
};

/** 계약 레지스트리 항목 — 온보딩 때 자동 식별 (§7.3) */
export interface ContractEntry {
	id: string;
	boundary: ContractBoundary;
	name: string;
	/** RPC/API 시그니처 원문 */
	signature: string;
	/** 계약이 정의된 파일 */
	file: string;
	/** 시그니처 변경 시 함께 수정해야 하는 반대편 코드 */
	counterparts: string[];
	/** 반대편 수정이 불가능한 외부 서비스면 위반 시 머지 차단 */
	external?: boolean;
}

/** 계약 위반 — 사람이 발견하기 전에 기계가 잡는다 (§7.1) */
export interface ContractViolation {
	contractId: string;
	contractName: string;
	boundary: ContractBoundary;
	/** warn = 반대편 수정 경고, block = 머지 차단 */
	severity: 'warn' | 'block';
	message: string;
	suggestion: string;
}
