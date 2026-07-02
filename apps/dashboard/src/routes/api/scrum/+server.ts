import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const engine = await getEngine();
	if (body.action === 'reaction') {
		engine.toggleReaction(body.postId, body.emoji, body.by ?? 'human:PO');
		return json({ ok: true });
	}
	const post = engine.addScrumPost({
		body: String(body.body ?? '').trim(),
		parentId: body.parentId,
		authorName: body.authorName
	});
	return json({ ok: true, post });
};
