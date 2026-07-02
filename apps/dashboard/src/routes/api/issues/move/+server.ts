import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { issueId, status } = await request.json();
	getEngine().moveIssue(issueId, status);
	return json({ ok: true });
};
