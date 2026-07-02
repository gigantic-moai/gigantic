import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, sessionToken } from '../../hooks.server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// 접근 제어가 꺼져 있으면 로그인 페이지가 필요 없다
	if (!env.DASHBOARD_PASSWORD) redirect(303, '/overview');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const password = env.DASHBOARD_PASSWORD;
		if (!password) redirect(303, '/overview');
		const form = await request.formData();
		if (String(form.get('password') ?? '') !== password) {
			return fail(400, { message: '비밀번호가 올바르지 않습니다' });
		}
		cookies.set(SESSION_COOKIE, sessionToken(password), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false, // 온프레미스 http 환경 허용 — TLS 종단은 §18 보안 후속
			maxAge: 60 * 60 * 24 * 30
		});
		redirect(303, '/overview');
	}
};
