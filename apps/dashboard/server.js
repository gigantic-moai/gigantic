/**
 * 프로덕션 서버 엔트리 — adapter-node 핸들러 + WebSocket(/ws).
 *
 * vite dev/preview에서는 vite 플러그인이 WS를 붙이지만, `node server.js`로 띄우는
 * 운영 환경(Docker)에서는 이 커스텀 서버가 같은 역할을 한다.
 * 소켓 집합은 globalThis.__giganticSockets — 엔진이 여기로 직접 브로드캐스트한다.
 */
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { handler } from './build/handler.js';

const sockets = (globalThis.__giganticSockets ??= new Set());
const wss = new WebSocketServer({ noServer: true });

const server = http.createServer(handler);

server.on('upgrade', (req, socket, head) => {
	if (!req.url || !req.url.startsWith('/ws')) {
		socket.destroy();
		return;
	}
	wss.handleUpgrade(req, socket, head, (ws) => {
		sockets.add(ws);
		ws.on('close', () => sockets.delete(ws));
	});
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
server.listen(port, host, () => {
	console.log(`🗿 Gigantic dashboard — http://${host}:${port} (ws: /ws)`);
});
