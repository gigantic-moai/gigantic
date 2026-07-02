import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation';
import { writable } from 'svelte/store';

export type RealtimeEvent =
	| { type: 'state-changed'; scope: string }
	| { type: 'heartbeat'; agents: { id: string; status: string; progress?: number; activity?: string }[] }
	| { type: 'toast'; message: string; kind?: 'info' | 'ok' | 'warn' };

/** WS 연결 상태 */
export const connected = writable(false);

/** 마지막 하트비트에서 온 에이전트 라이브 상태 (배지 실시간 갱신용) */
export const liveAgents = writable<Map<string, { status: string; progress?: number; activity?: string }>>(
	new Map()
);

let started = false;
let invalidateTimer: ReturnType<typeof setTimeout> | undefined;
let pollTimer: ReturnType<typeof setInterval> | undefined;
let onEventCallbacks: ((e: RealtimeEvent) => void)[] = [];

export function onRealtimeEvent(cb: (e: RealtimeEvent) => void): () => void {
	onEventCallbacks.push(cb);
	return () => {
		onEventCallbacks = onEventCallbacks.filter((f) => f !== cb);
	};
}

function scheduleInvalidate() {
	clearTimeout(invalidateTimer);
	invalidateTimer = setTimeout(() => invalidateAll(), 250);
}

function handleMessage(raw: string) {
	let ev: RealtimeEvent;
	try {
		ev = JSON.parse(raw);
	} catch {
		return;
	}
	if (ev.type === 'state-changed') scheduleInvalidate();
	if (ev.type === 'heartbeat') {
		liveAgents.update((m) => {
			for (const a of ev.agents) m.set(a.id, a);
			return new Map(m);
		});
	}
	for (const cb of onEventCallbacks) cb(ev);
}

/** WebSocket 연결 시작 — 실패 시 20초 폴링으로 폴백 */
export function startRealtime() {
	if (!browser || started) return;
	started = true;
	let retry = 0;

	const connect = () => {
		let ws: WebSocket;
		try {
			const proto = location.protocol === 'https:' ? 'wss' : 'ws';
			ws = new WebSocket(`${proto}://${location.host}/ws`);
		} catch {
			fallbackPoll();
			return;
		}
		ws.onopen = () => {
			retry = 0;
			connected.set(true);
			if (pollTimer) {
				clearInterval(pollTimer);
				pollTimer = undefined;
			}
		};
		ws.onmessage = (e) => handleMessage(String(e.data));
		ws.onclose = () => {
			connected.set(false);
			retry += 1;
			if (retry > 5) fallbackPoll();
			else setTimeout(connect, Math.min(1000 * retry, 5000));
		};
		ws.onerror = () => ws.close();
	};

	const fallbackPoll = () => {
		if (pollTimer) return;
		pollTimer = setInterval(() => invalidateAll(), 20000);
	};

	connect();
}
