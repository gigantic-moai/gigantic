import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const engine = await getEngine();
	switch (body.action) {
		case 'approve-onboarding': {
			const r = engine.approveOnboarding(params.id);
			return json(r, { status: r.ok ? 200 : 409 });
		}
		case 'reject-onboarding':
			engine.rejectOnboarding(params.id);
			return json({ ok: true });
		case 'schedule':
			engine.updateSchedule(params.id, body.schedule);
			return json({ ok: true });
		case 'toggle-pause':
			engine.togglePause(params.id);
			return json({ ok: true });
		default:
			return json({ ok: false, reason: 'unknown action' }, { status: 400 });
	}
};
