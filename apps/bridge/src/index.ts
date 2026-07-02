/**
 * 🔌 Gigantic UE 런타임 브릿지 (오케스트레이터) — :4000
 *
 * - GET /status              서비스 상태 (대시보드의 연결 확인이 조회)
 * - WS  /bridge              프로토콜: editor-command · runtime-state · build · log 스트림
 *
 * UE 에디터 연결은 MockUeEditor가 대신한다 — 실제 플러그인/사이드카가 붙으면
 * 같은 프로토콜로 교체된다. 디버거(DAP)는 외부 Quilla 담당이라 여기 없다.
 */
import http from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import type { BridgeRequest, BridgeServerMessage, BridgeStatus } from '@gigantic/shared';
import { MockUeEditor } from './ue-connector/index.js';

const PORT = Number(process.env.ORCHESTRATOR_PORT ?? process.env.PORT ?? 4000);
const VERSION = '0.1.0';
const startedAt = new Date();

const editor = new MockUeEditor();
let buildCount = 0;
const clients = new Set<WebSocket>();
const logSubscribers = new Set<WebSocket>();

function send(ws: WebSocket, message: BridgeServerMessage) {
	if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
}

/* ── HTTP: /status ─────────────────────────────── */

const server = http.createServer((req, res) => {
	if (req.url === '/status') {
		const status: BridgeStatus = {
			service: 'gigantic-bridge',
			version: VERSION,
			startedAt: startedAt.toISOString(),
			uptimeSec: Math.round((Date.now() - startedAt.getTime()) / 1000),
			editors: 1, // mock 에디터
			builds: buildCount
		};
		res.writeHead(200, { 'content-type': 'application/json' });
		res.end(JSON.stringify(status));
		return;
	}
	res.writeHead(404, { 'content-type': 'application/json' });
	res.end(JSON.stringify({ error: 'not found' }));
});

/* ── WS: /bridge ───────────────────────────────── */

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
	if (!req.url || !req.url.startsWith('/bridge')) {
		socket.destroy();
		return;
	}
	wss.handleUpgrade(req, socket, head, (ws) => {
		clients.add(ws);
		ws.on('close', () => {
			clients.delete(ws);
			logSubscribers.delete(ws);
		});
		ws.on('message', (raw) => void handleMessage(ws, String(raw)));
	});
});

async function handleMessage(ws: WebSocket, raw: string) {
	let req: BridgeRequest;
	try {
		req = JSON.parse(raw);
	} catch {
		return;
	}
	try {
		switch (req.type) {
			case 'editor-command': {
				// BR-01 — 블루프린트 컴파일 / 레벨 로드 / PIE
				const result = await editor.execute(req.command, req.args);
				send(ws, { kind: 'response', id: req.id, ok: true, result });
				break;
			}
			case 'runtime-state': {
				// BR-02 — 액터 목록 / 변수 값
				const result =
					req.query === 'actors'
						? { state: editor.state(), actors: editor.actors }
						: editor.queryVariable(req.name);
				send(ws, { kind: 'response', id: req.id, ok: true, result });
				break;
			}
			case 'build': {
				// BR-04 — 컴파일 트리거 + 진행률 + 결과
				send(ws, { kind: 'response', id: req.id, ok: true, result: { queued: req.target } });
				const t0 = Date.now();
				for (const pct of [10, 35, 60, 85, 100]) {
					await new Promise((r) => setTimeout(r, 500));
					send(ws, { kind: 'event', type: 'build-progress', target: req.target, pct });
				}
				buildCount += 1;
				send(ws, {
					kind: 'event',
					type: 'build-result',
					target: req.target,
					success: true,
					durationSec: Math.round((Date.now() - t0) / 100) / 10
				});
				break;
			}
			case 'subscribe-logs': // BR-05
				logSubscribers.add(ws);
				send(ws, { kind: 'response', id: req.id, ok: true, result: { subscribed: true } });
				break;
			case 'unsubscribe-logs':
				logSubscribers.delete(ws);
				send(ws, { kind: 'response', id: req.id, ok: true, result: { subscribed: false } });
				break;
		}
	} catch (err) {
		send(ws, { kind: 'response', id: req.id, ok: false, error: String(err) });
	}
}

// UE OutputLog 스트리밍 (BR-05) — 구독자에게 주기 전달
setInterval(() => {
	if (logSubscribers.size === 0) return;
	const line = editor.nextLogLine();
	for (const ws of logSubscribers) send(ws, { kind: 'event', type: 'log', line });
}, 1200).unref();

server.listen(PORT, () => {
	console.log(`🔌 gigantic-bridge v${VERSION} — http://0.0.0.0:${PORT} (ws: /bridge)`);
});
