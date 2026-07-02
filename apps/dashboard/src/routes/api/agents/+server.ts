import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

/** 🗿 Spawn — 에이전트를 처음 만들 때만 사용 (§1.4) */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const persona = body.persona;
	if (!persona?.name || !persona?.role) {
		return json({ ok: false, reason: '이름과 역할은 필수입니다' }, { status: 400 });
	}
	const agent = getEngine().spawnAgent(persona, body.schedule);
	return json({ ok: true, agent });
};
