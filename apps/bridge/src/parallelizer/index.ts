/**
 * 병렬화 엔진 (PA-01 ~ PA-03 초기 구현).
 * P4 워크스페이스 뷰 매핑 계산과 .uasset 충돌 사전 분석 — 순수 로직.
 * 실제 p4 CLI 호출은 이 모듈 뒤에 붙는다.
 */

export interface WorkspaceSpec {
	name: string;
	root: string;
	/** 필요한 파일만 sync하는 뷰 매핑 (디스크 병목 해소) */
	view: string[];
	sharedDdc: string;
}

export function planWorkspace(input: {
	agentId: string;
	depot: string;
	workspaceRoot: string;
	sharedDdc: string;
	expectedFiles: string[];
}): WorkspaceSpec {
	const name = `gigantic-ws-${input.agentId}`;
	const depotBase = input.depot.replace(/\/\.\.\.$/, '');
	// 변경 예상 파일의 상위 디렉터리만 매핑 + 빌드에 필요한 공통 경로
	const dirs = new Set<string>(['Config', 'Source/*/Public', 'Plugins/GiganticBridge']);
	for (const f of input.expectedFiles) {
		const dir = f.split('/').slice(0, -1).join('/');
		if (dir) dirs.add(dir);
	}
	return {
		name,
		root: `${input.workspaceRoot}/${name}`,
		view: [...dirs].sort().map((d) => `${depotBase}/${d}/... //${name}/${d}/...`),
		sharedDdc: input.sharedDdc
	};
}

/** 같은 .uasset(배타적 잠금)을 건드리는 작업 쌍 — 동시 할당 금지 대상 */
export function detectUassetConflicts(
	jobs: { id: string; uassets: string[] }[]
): { a: string; b: string; asset: string }[] {
	const conflicts: { a: string; b: string; asset: string }[] = [];
	for (let i = 0; i < jobs.length; i++) {
		for (let j = i + 1; j < jobs.length; j++) {
			const shared = jobs[i].uassets.find((u) => jobs[j].uassets.includes(u));
			if (shared) conflicts.push({ a: jobs[i].id, b: jobs[j].id, asset: shared });
		}
	}
	return conflicts;
}
