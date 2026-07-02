import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const engine = getEngine();
	engine.updateSettings(body.settings ?? {}, body.apiKey);
	return json({ ok: true, settings: engine.state.settings });
};
