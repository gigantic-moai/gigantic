import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const engine = await getEngine();
	engine.updateSettings(body.settings ?? {}, { apiKey: body.apiKey, p4Password: body.p4Password });
	return json({ ok: true, settings: engine.state.settings });
};
