/**
 * 지식/계약 엔진 (B-4/B-6 초기 구현).
 * 소스 코드에서 시스템 간 계약(UFUNCTION Server/Client RPC)을 식별한다 — §7.3.
 */

export interface RpcContract {
	name: string;
	direction: 'server' | 'client';
	signature: string;
	file: string;
}

/** UFUNCTION(Server|Client ...) 마커가 붙은 RPC 시그니처 추출 */
export function extractRpcContracts(file: string, source: string): RpcContract[] {
	const contracts: RpcContract[] = [];
	const re = /UFUNCTION\s*\(\s*(Server|Client)[^)]*\)\s*([^;{]+);/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(source)) !== null) {
		const signature = m[2].replace(/\s+/g, ' ').trim();
		const name = signature.match(/([A-Za-z0-9_]+)\s*\(/)?.[1] ?? signature;
		contracts.push({
			name,
			direction: m[1].toLowerCase() as 'server' | 'client',
			signature: `UFUNCTION(${m[1]}) ${signature};`,
			file
		});
	}
	return contracts;
}

/** 계약 시그니처 변경 감지 — 이름은 같은데 시그니처가 달라졌으면 위반 후보 */
export function diffContracts(
	before: RpcContract[],
	after: RpcContract[]
): { name: string; before: string; after: string }[] {
	const prev = new Map(before.map((c) => [c.name, c]));
	const changed: { name: string; before: string; after: string }[] = [];
	for (const c of after) {
		const old = prev.get(c.name);
		if (old && old.signature !== c.signature) {
			changed.push({ name: c.name, before: old.signature, after: c.signature });
		}
	}
	return changed;
}
