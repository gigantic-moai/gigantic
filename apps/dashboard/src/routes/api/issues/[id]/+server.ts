import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

const list = (v: unknown): string[] | undefined =>
	Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : undefined;

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const engine = await getEngine();
	switch (body.action) {
		case 'update': {
			const result = engine.updateIssue(params.id, {
				title: body.title !== undefined ? String(body.title).trim() : undefined,
				description: body.description !== undefined ? String(body.description).trim() : undefined,
				priority: ['p0', 'p1', 'p2'].includes(body.priority) ? body.priority : undefined,
				tags: list(body.tags),
				deps: list(body.deps),
				expectedFiles: list(body.expectedFiles),
				uassets: list(body.uassets),
				// '' → 미할당(null), 미전달 → 변경 없음
				assigneeId: body.assigneeId === undefined ? undefined : body.assigneeId || null
			});
			return json(result, { status: result.ok ? 200 : 404 });
		}
		case 'delete': {
			const result = engine.deleteIssue(params.id);
			return json(result, { status: result.ok ? 200 : 409 });
		}
		default:
			return json({ ok: false, reason: 'unknown action' }, { status: 400 });
	}
};
