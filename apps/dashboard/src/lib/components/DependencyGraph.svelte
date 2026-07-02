<script lang="ts">
	import type { Agent, Issue } from '@gigantic/shared';
	import MoaiAvatar from './MoaiAvatar.svelte';

	let { issues, agents }: { issues: Issue[]; agents: Agent[] } = $props();

	const NODE_W = 176;
	const NODE_H = 62;
	const GAP_X = 70;
	const GAP_Y = 20;
	const PAD = 24;

	interface Node {
		issue: Issue;
		layer: number;
		x: number;
		y: number;
	}

	const graph = $derived.by(() => {
		const byId = new Map(issues.map((i) => [i.id, i]));
		// 레이어 = 의존 체인 깊이 (Kahn)
		const layerOf = new Map<string, number>();
		const resolve = (id: string, seen: Set<string>): number => {
			if (layerOf.has(id)) return layerOf.get(id)!;
			if (seen.has(id)) return 0; // 순환 방어
			seen.add(id);
			const issue = byId.get(id);
			const deps = (issue?.deps ?? []).filter((d) => byId.has(d));
			const layer = deps.length === 0 ? 0 : 1 + Math.max(...deps.map((d) => resolve(d, seen)));
			layerOf.set(id, layer);
			return layer;
		};
		for (const i of issues) resolve(i.id, new Set());

		const layers: Issue[][] = [];
		for (const i of issues) {
			const l = layerOf.get(i.id) ?? 0;
			(layers[l] ??= []).push(i);
		}
		const nodes = new Map<string, Node>();
		layers.forEach((list, l) => {
			list.forEach((issue, idx) => {
				nodes.set(issue.id, {
					issue,
					layer: l,
					x: PAD + l * (NODE_W + GAP_X),
					y: PAD + idx * (NODE_H + GAP_Y)
				});
			});
		});

		const edges: { from: Node; to: Node }[] = [];
		for (const i of issues) {
			const to = nodes.get(i.id)!;
			for (const d of i.deps) {
				const from = nodes.get(d);
				if (from) edges.push({ from, to });
			}
		}

		// PA-03: 같은 .uasset을 건드리는 미완료 이슈끼리 충돌 (직렬화 대상)
		const conflicts: { a: Node; b: Node; asset: string }[] = [];
		const open = issues.filter((i) => i.status !== 'done');
		for (let x = 0; x < open.length; x++) {
			for (let y = x + 1; y < open.length; y++) {
				const shared = open[x].uassets.find((u) => open[y].uassets.includes(u));
				if (shared) {
					conflicts.push({ a: nodes.get(open[x].id)!, b: nodes.get(open[y].id)!, asset: shared });
				}
			}
		}

		const width = PAD * 2 + layers.length * (NODE_W + GAP_X) - GAP_X;
		const height = PAD * 2 + Math.max(...layers.map((l) => l.length), 1) * (NODE_H + GAP_Y) - GAP_Y;
		return { nodes: [...nodes.values()], edges, conflicts, width, height };
	});

	const statusColor = (s: Issue['status']) =>
		s === 'done'
			? 'var(--color-ok)'
			: s === 'review'
				? 'var(--color-moai-gold)'
				: s === 'in-progress'
					? 'var(--color-info)'
					: 'var(--color-moai-dim)';

	const agentOf = (id?: string) => agents.find((a) => a.id === id);

	function edgePath(from: Node, to: Node): string {
		const x1 = from.x + NODE_W;
		const y1 = from.y + NODE_H / 2;
		const x2 = to.x;
		const y2 = to.y + NODE_H / 2;
		const mx = (x1 + x2) / 2;
		return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2 - 6} ${y2}`;
	}
</script>

<div class="overflow-auto">
	<svg
		viewBox={`0 0 ${graph.width} ${graph.height}`}
		width={graph.width}
		height={graph.height}
		class="max-w-none"
		role="img"
		aria-label="이슈 의존성 그래프"
	>
		<defs>
			<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
				<path d="M 0 1 L 9 5 L 0 9 Z" fill="var(--color-moai-gold)" />
			</marker>
		</defs>

		<!-- 의존성 엣지 -->
		{#each graph.edges as e, i (i)}
			<path d={edgePath(e.from, e.to)} fill="none" stroke="var(--color-moai-gold)" stroke-width="1.6" opacity="0.65" marker-end="url(#arrow)" />
		{/each}

		<!-- .uasset 충돌 (직렬화) -->
		{#each graph.conflicts as c, i (i)}
			<path
				d={`M ${c.a.x + NODE_W / 2} ${c.a.y + (c.a.y < c.b.y ? NODE_H : 0)} L ${c.b.x + NODE_W / 2} ${c.b.y + (c.a.y < c.b.y ? 0 : NODE_H)}`}
				stroke="var(--color-danger)"
				stroke-width="1.4"
				stroke-dasharray="5 4"
				fill="none"
			>
				<title>{c.asset} — 배타적 잠금 충돌, 직렬화 실행</title>
			</path>
		{/each}

		<!-- 노드 -->
		{#each graph.nodes as n (n.issue.id)}
			<g>
				<rect
					x={n.x}
					y={n.y}
					width={NODE_W}
					height={NODE_H}
					rx="10"
					fill="var(--color-moai-panel)"
					stroke={statusColor(n.issue.status)}
					stroke-width="1.4"
					opacity={n.issue.status === 'done' ? 0.55 : 1}
				/>
				<text x={n.x + 12} y={n.y + 21} font-size="11" font-weight="700" fill={statusColor(n.issue.status)} font-family="var(--font-mono)">
					{n.issue.key}
				</text>
				{#if n.issue.uassets.length > 0}
					<text x={n.x + NODE_W - 12} y={n.y + 21} font-size="10" text-anchor="end" fill="var(--color-warn)">🔒</text>
				{/if}
				<text x={n.x + 12} y={n.y + 40} font-size="10.5" fill="var(--color-moai-text)">
					{n.issue.title.length > 15 ? n.issue.title.slice(0, 15) + '…' : n.issue.title}
				</text>
				<text x={n.x + 12} y={n.y + 54} font-size="9" fill="var(--color-moai-dim)">
					{agentOf(n.issue.assigneeId)?.persona.name ?? '미할당'} · {n.issue.priority.toUpperCase()}
				</text>
			</g>
		{/each}
	</svg>
</div>
