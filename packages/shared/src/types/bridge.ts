/**
 * UE 런타임 브릿지 프로토콜 — 에이전트/대시보드 ↔ 브릿지(오케스트레이터) 간 WS 계약.
 *
 * 브릿지는 UE 에디터와 소켓으로 통신하는 sidecar/플러그인이다.
 * 디버거(DAP)는 이 프로토콜에 없다 — 외부 Quilla가 담당한다.
 */

/** GET /status 응답 */
export interface BridgeStatus {
	service: 'gigantic-bridge';
	version: string;
	startedAt: string;
	uptimeSec: number;
	/** 연결된 UE 에디터 수 */
	editors: number;
	/** 수행한 빌드 수 */
	builds: number;
}

/** 에디터 명령 — 블루프린트 컴파일, 레벨 로드, PIE */
export type EditorCommand = 'compile-blueprint' | 'load-level' | 'start-pie' | 'stop-pie';

export type BridgeRequest = { id: string } & (
	| { type: 'editor-command'; command: EditorCommand; args?: Record<string, string> }
	| { type: 'runtime-state'; query: 'actors' | 'variable'; name?: string }
	| { type: 'build'; target: string }
	| { type: 'subscribe-logs' }
	| { type: 'unsubscribe-logs' }
);

export interface BridgeResponse {
	id: string;
	ok: boolean;
	result?: unknown;
	error?: string;
}

/** 브릿지 → 클라이언트 푸시 이벤트 */
export type BridgeEvent =
	| { type: 'log'; line: string } // UE OutputLog 스트리밍
	| { type: 'build-progress'; target: string; pct: number }
	| { type: 'build-result'; target: string; success: boolean; durationSec: number };

export type BridgeServerMessage =
	| ({ kind: 'response' } & BridgeResponse)
	| ({ kind: 'event' } & BridgeEvent);
