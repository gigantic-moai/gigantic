/**
 * 온보딩 엔진 (B-4 초기 구현) — P4 changeset 파싱/패턴 추출의 순수 로직.
 * 실 데이터 소스(p4 changes/describe) 연결 전, 파서 계약을 먼저 고정한다.
 */

export interface ParsedChangeset {
	number: number;
	author: string;
	description: string;
	issueKeys: string[];
	files: string[];
}

/** description에서 이슈 키([GIG-7], GIG-7:)와 태그를 추출 */
export function parseDescription(desc: string): { issueKeys: string[]; tags: string[] } {
	const issueKeys = [...new Set([...desc.matchAll(/\b([A-Z]{2,8}-\d+)\b/g)].map((m) => m[1]))];
	const tags = [...new Set([...desc.matchAll(/#([\p{L}\p{N}_-]+)/gu)].map((m) => m[1]))];
	return { issueKeys, tags };
}

/** 반복 등장하는 코드 심볼로 구현 패턴 후보를 뽑는다 (빈도 기반) */
export function extractPatternCandidates(
	changesets: ParsedChangeset[],
	minOccurrences = 3
): { symbol: string; occurrences: number }[] {
	const counts = new Map<string, number>();
	for (const cs of changesets) {
		const symbols = cs.description.match(/\b[UAF][A-Z][A-Za-z0-9]+|\b[A-Z][A-Za-z]+::[A-Za-z]+/g) ?? [];
		for (const s of new Set(symbols)) counts.set(s, (counts.get(s) ?? 0) + 1);
	}
	return [...counts.entries()]
		.filter(([, n]) => n >= minOccurrences)
		.sort((a, b) => b[1] - a[1])
		.map(([symbol, occurrences]) => ({ symbol, occurrences }));
}

/** 파일별 변경 이력 컨텍스트 — 핫스팟 산출 */
export function changeHotspots(
	changesets: ParsedChangeset[]
): { file: string; changes: number; authors: string[] }[] {
	const byFile = new Map<string, { changes: number; authors: Set<string> }>();
	for (const cs of changesets) {
		for (const f of cs.files) {
			const entry = byFile.get(f) ?? { changes: 0, authors: new Set<string>() };
			entry.changes += 1;
			entry.authors.add(cs.author);
			byFile.set(f, entry);
		}
	}
	return [...byFile.entries()]
		.map(([file, e]) => ({ file, changes: e.changes, authors: [...e.authors] }))
		.sort((a, b) => b.changes - a.changes);
}
