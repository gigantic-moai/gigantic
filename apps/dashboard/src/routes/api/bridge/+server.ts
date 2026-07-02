import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

/** UE 브릿지(오케스트레이터) 연결 확인 — 설정된 포트의 /status를 조회 */
export const GET: RequestHandler = async () => {
	const { state } = await getEngine();
	const port = state.settings.network.orchestratorPort;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 1500);
	try {
		const res = await fetch(`http://127.0.0.1:${port}/status`, { signal: controller.signal });
		if (!res.ok) return json({ connected: false, port });
		return json({ connected: true, port, status: await res.json() });
	} catch {
		return json({ connected: false, port });
	} finally {
		clearTimeout(timeout);
	}
};
