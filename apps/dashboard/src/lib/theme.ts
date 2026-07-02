import { browser } from '$app/environment';
import type { GiganticSettings } from '@gigantic/shared';

export type ThemeConfig = GiganticSettings['theme'];

const STORAGE_KEY = 'gigantic-theme';

/** <html>에 테마를 즉시 반영 (미리보기용 — 저장하지 않음) */
export function previewTheme(theme: ThemeConfig) {
	if (!browser) return;
	const el = document.documentElement;
	el.dataset.theme = theme.mode;
	el.dataset.accent = theme.accent;
}

/** 테마 반영 + FOUC 방지용 localStorage 미러 저장 */
export function applyTheme(theme: ThemeConfig) {
	previewTheme(theme);
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
	} catch {
		/* localStorage 접근 불가 환경은 무시 */
	}
}
