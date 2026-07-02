/**
 * P4 API 래퍼 (§14 — lib/server/p4)
 *
 * 실제 구현은 브릿지 트랙(B-2)에서 p4 CLI/API에 연결된다.
 * 대시보드 단독 실행(mock 모드)에서는 엔진의 인메모리 changelist를 그대로 반환한다.
 */
import { env } from '$env/dynamic/private';
import { getEngine } from '../engine/state';
import type { Changelist } from '@gigantic/shared';

export interface P4Config {
	port: string;
	user: string;
	depot: string;
	connected: boolean;
}

export function p4Config(): P4Config {
	return {
		port: env.P4PORT ?? 'ssl:perforce.local:1666 (mock)',
		user: env.P4USER ?? 'gigantic-agent',
		depot: env.P4DEPOT ?? '//project/main/...',
		connected: false // mock 모드 — 브릿지 연결 시 true
	};
}

/** 에이전트별 P4 워크스페이스 이름 규칙 (PA-01) */
export function workspaceName(agentId: string): string {
	return `gigantic-ws-${agentId}`;
}

export async function getChangelists(): Promise<Changelist[]> {
	return getEngine().state.changelists;
}

export async function getChangelist(id: string): Promise<Changelist | undefined> {
	return getEngine().state.changelists.find((c) => c.id === id || String(c.number) === id);
}
