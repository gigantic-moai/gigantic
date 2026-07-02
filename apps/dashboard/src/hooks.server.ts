/**
 * 대시보드 접근 제어 (선택적).
 *
 * DASHBOARD_PASSWORD가 설정되면 세션 쿠키 없는 요청은 /login으로 보낸다.
 * 온프레미스 단일 팀 사용을 전제로 한 단순 게이트 — 미설정 시 완전 개방.
 */
import { createHash } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { json, redirect, type Handle } from '@sveltejs/kit';

export const SESSION_COOKIE = 'gigantic_session';

/** 비밀번호에서 세션 토큰 유도 — 쿠키에 비밀번호 원문을 싣지 않는다 */
export function sessionToken(password: string): string {
	return createHash('sha256').update(`gigantic-moai:${password}`).digest('hex');
}

const PUBLIC_PREFIXES = ['/login', '/favicon', '/_app'];

export const handle: Handle = async ({ event, resolve }) => {
	const password = env.DASHBOARD_PASSWORD;
	if (password) {
		const authed = event.cookies.get(SESSION_COOKIE) === sessionToken(password);
		const path = event.url.pathname;
		const isPublic = PUBLIC_PREFIXES.some((p) => path.startsWith(p));
		if (!authed && !isPublic) {
			if (path.startsWith('/api')) {
				return json({ ok: false, reason: 'unauthorized' }, { status: 401 });
			}
			redirect(303, '/login');
		}
		if (authed && path === '/login') redirect(303, '/overview');
	}
	return resolve(event);
};
