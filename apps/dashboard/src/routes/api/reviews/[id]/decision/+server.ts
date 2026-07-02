import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { decision } = await request.json();
	const result = getEngine().decide(params.id, decision);
	return json(result, { status: result.ok ? 200 : 409 });
};
