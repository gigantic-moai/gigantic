import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const comment = getEngine().addComment({
		changelistId: params.id,
		filePath: body.filePath,
		line: body.line,
		lineType: body.lineType,
		body: String(body.body ?? '').trim(),
		authorName: body.authorName ?? 'PO',
		parentId: body.parentId
	});
	return json({ ok: true, comment });
};
