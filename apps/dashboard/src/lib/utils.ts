/** mulberry32 — 시드 기반 결정적 RNG (모아이/섬 프로시저럴 생성용) */
export function seededRng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function hashString(s: string): number {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

const rtf = new Intl.RelativeTimeFormat('ko', { numeric: 'always' });

/** "3분 전" 형태의 상대 시간 */
export function timeAgo(iso: string, now: Date = new Date()): string {
	const then = new Date(iso).getTime();
	const diffSec = Math.round((then - now.getTime()) / 1000);
	const abs = Math.abs(diffSec);
	if (abs < 45) return '방금';
	if (abs < 3600) return rtf.format(Math.trunc(diffSec / 60), 'minute');
	if (abs < 86400) return rtf.format(Math.trunc(diffSec / 3600), 'hour');
	if (abs < 86400 * 30) return rtf.format(Math.trunc(diffSec / 86400), 'day');
	return new Date(iso).toLocaleDateString('ko-KR');
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString('ko-KR', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		weekday: 'short'
	});
}

export function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(s: string): string {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

/** 스크럼/코멘트 본문 — HTML 이스케이프 후 @멘션 하이라이트 */
export function renderBody(body: string): string {
	return escapeHtml(body).replace(
		/@([\p{L}\p{N}_-]+)/gu,
		'<span class="mention">@$1</span>'
	);
}

/** "GIG-12" → 정렬용 숫자 */
export function issueKeyNum(key: string): number {
	const m = key.match(/(\d+)$/);
	return m ? parseInt(m[1], 10) : 0;
}
