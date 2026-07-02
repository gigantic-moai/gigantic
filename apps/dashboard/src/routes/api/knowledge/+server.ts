import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const engine = getEngine();
	switch (body.action) {
		case 'approve':
			engine.setKnowledgeStatus(body.id, 'approved');
			break;
		case 'reject':
			engine.setKnowledgeStatus(body.id, 'rejected');
			break;
		case 'update':
			engine.updateKnowledge(body.id, { title: body.title, body: body.body, tags: body.tags });
			break;
		case 'add':
			engine.addKnowledge({
				category: body.category,
				title: body.title,
				body: body.body,
				tags: body.tags ?? []
			});
			break;
		default:
			return json({ ok: false, reason: 'unknown action' }, { status: 400 });
	}
	return json({ ok: true });
};
