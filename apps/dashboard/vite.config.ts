import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer } from 'ws';

/** dev/preview 서버 공통 — http/http2 서버 모두 upgrade 이벤트만 쓴다 */
interface UpgradableServer {
	on(event: 'upgrade', listener: (req: IncomingMessage, socket: Duplex, head: Buffer) => void): void;
}

/**
 * 에이전트 상태 실시간 스트리밍용 WebSocket (§13).
 * 소켓 집합은 globalThis에 두어 SvelteKit 서버 모듈(엔진)이 같은 프로세스에서
 * 바로 브로드캐스트할 수 있게 한다.
 */
function giganticRealtime(): Plugin {
	const attach = (httpServer: UpgradableServer | null) => {
		if (!httpServer) return;
		const wss = new WebSocketServer({ noServer: true });
		const g = globalThis as Record<string, unknown>;
		const sockets = (g.__giganticSockets as Set<unknown>) ?? new Set();
		g.__giganticSockets = sockets;
		httpServer.on('upgrade', (req, socket, head) => {
			if (!req.url || !req.url.startsWith('/ws')) return;
			wss.handleUpgrade(req, socket, head, (ws) => {
				sockets.add(ws);
				ws.on('close', () => sockets.delete(ws));
			});
		});
	};
	return {
		name: 'gigantic-realtime-ws',
		configureServer(server) {
			attach(server.httpServer);
		},
		configurePreviewServer(server) {
			attach(server.httpServer);
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), giganticRealtime()],
	server: {
		port: 5173
	},
	preview: {
		port: 5173
	},
	ssr: {
		noExternal: ['@gigantic/shared']
	}
});
