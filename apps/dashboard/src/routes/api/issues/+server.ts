import { json } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { RequestHandler } from './$types';

const list = (v: unknown): string[] =>
	Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];

/** 이슈 생성 — 담당은 전문 태그 매칭으로 자동 결정 가능 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const title = String(body.title ?? '').trim();
	if (!title) return json({ ok: false, reason: '제목은 필수입니다' }, { status: 400 });
	const engine = await getEngine();
	const result = engine.addIssue({
		title,
		description: String(body.description ?? '').trim(),
		priority: ['p0', 'p1', 'p2'].includes(body.priority) ? body.priority : 'p1',
		tags: list(body.tags),
		deps: list(body.deps),
		expectedFiles: list(body.expectedFiles),
		uassets: list(body.uassets),
		assigneeId: body.assigneeId || undefined
	});
	return json({ ok: true, ...result });
};
