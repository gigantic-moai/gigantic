<script lang="ts">
	import type { IslandProfile } from '@gigantic/shared';
	import { seededRng } from '$lib/utils';

	let { island, width = 260 }: { island: IslandProfile; width?: number } = $props();

	const H = 130;
	const W = 240;
	const seaY = 92;

	const model = $derived.by(() => {
		const rng = seededRng(island.seed);
		// 🗺️ 에셋 매핑 → 섬의 넓이
		const islandHalf = 46 + island.plains * 52;
		// 🔧 구현 패턴 → 산의 높이/험준함
		const peakCount = island.mountains > 0.66 ? 3 : island.mountains > 0.25 ? 2 : 1;
		const peaks = Array.from({ length: peakCount }, (_, i) => {
			const px = 120 + (i - (peakCount - 1) / 2) * (26 + rng() * 14);
			const ph = 14 + island.mountains * 58 * (0.72 + rng() * 0.28);
			const pw = 16 + rng() * 10 + island.mountains * 8;
			return { px, ph, pw, snow: ph > 44 };
		}).sort((a, b) => a.px - b.px);
		// 📊 변경 이력 → 지층 줄 수
		const strataCount = Math.round(island.strata * 5);
		// 📜 계약 → 다리/항구 수
		const bridgeCount = Math.round(island.bridges * 4);
		const trees = Array.from({ length: 2 + Math.round(island.plains * 3) }, () => ({
			tx: 120 + (rng() - 0.5) * islandHalf * 1.5,
			th: 7 + rng() * 5
		}));
		return { islandHalf, peaks, strataCount, bridgeCount, trees, rng };
	});
</script>

<svg viewBox={`0 0 ${W} ${H}`} {width} role="img" aria-label="에이전트의 섬">
	<!-- 바다 -->
	<rect x="0" y={seaY} width={W} height={H - seaY} rx="8" fill="#12202e" />
	<path d={`M 0 ${seaY} H ${W}`} stroke="#2b4a63" stroke-width="1.4" />
	{#each [18, 60, 168, 210] as wx, i (wx)}
		<path
			d={`M ${wx} ${seaY + 10 + (i % 2) * 9} q 5 -3 10 0 q 5 3 10 0`}
			stroke="#2b4a63"
			stroke-width="1.2"
			fill="none"
		/>
	{/each}

	<!-- 섬 본체 (넓이 = 에셋 매핑) -->
	<path
		d={`M ${120 - model.islandHalf} ${seaY}
			Q ${120 - model.islandHalf * 0.55} ${seaY - 16} 120 ${seaY - 18}
			Q ${120 + model.islandHalf * 0.55} ${seaY - 16} ${120 + model.islandHalf} ${seaY}
			Z`}
		fill="#4a4238"
	/>
	<!-- 지층 (변경 이력) -->
	{#each Array.from({ length: model.strataCount }) as _, i (i)}
		{@const sy = seaY - 3 - i * 3.2}
		{@const sw = model.islandHalf * (0.94 - i * 0.13)}
		<path d={`M ${120 - sw} ${sy} H ${120 + sw}`} stroke={i % 2 === 0 ? '#5d5344' : '#3a332b'} stroke-width="1.5" opacity="0.9" />
	{/each}
	<!-- 풀밭 표면 -->
	<path
		d={`M ${120 - model.islandHalf * 0.92} ${seaY - 6.5}
			Q 120 ${seaY - 22} ${120 + model.islandHalf * 0.92} ${seaY - 6.5}
			Q 120 ${seaY - 12} ${120 - model.islandHalf * 0.92} ${seaY - 6.5}
			Z`}
		fill="#55683f"
	/>

	<!-- 산 (구현 패턴) -->
	{#each model.peaks as p, i (i)}
		<path
			d={`M ${p.px - p.pw} ${seaY - 14} L ${p.px} ${seaY - 14 - p.ph} L ${p.px + p.pw} ${seaY - 13} Z`}
			fill={i % 2 === 0 ? '#6b6155' : '#5a5148'}
		/>
		<path
			d={`M ${p.px} ${seaY - 14 - p.ph} L ${p.px + p.pw} ${seaY - 13} L ${p.px + p.pw * 0.4} ${seaY - 13.5} Z`}
			fill="#453e36"
			opacity="0.7"
		/>
		{#if p.snow}
			<path
				d={`M ${p.px - p.pw * 0.22} ${seaY - 14 - p.ph + p.ph * 0.22} L ${p.px} ${seaY - 14 - p.ph} L ${p.px + p.pw * 0.22} ${seaY - 14 - p.ph + p.ph * 0.22} L ${p.px + p.pw * 0.1} ${seaY - 14 - p.ph + p.ph * 0.3} L ${p.px - p.pw * 0.1} ${seaY - 14 - p.ph + p.ph * 0.26} Z`}
				fill="#e8e6e0"
			/>
		{/if}
	{/each}

	<!-- 나무 -->
	{#each model.trees as t, i (i)}
		<path d={`M ${t.tx} ${seaY - 8} v ${-t.th}`} stroke="#4a3b28" stroke-width="1.6" />
		<circle cx={t.tx} cy={seaY - 9 - t.th} r={t.th * 0.55 + 2} fill="#4e7a45" />
	{/each}

	<!-- 다리/항구 (계약) -->
	{#each Array.from({ length: model.bridgeCount }) as _, i (i)}
		{@const side = i % 2 === 0 ? 1 : -1}
		{@const bx = 120 + side * (model.islandHalf + 2)}
		{@const len = 20 + i * 7}
		<path d={`M ${bx - side * 4} ${seaY - 2} L ${bx + side * len} ${seaY - 2}`} stroke="#8a6f45" stroke-width="3" stroke-linecap="round" />
		{#each [0.3, 0.65, 0.95] as f (f)}
			<path d={`M ${bx + side * len * f} ${seaY - 2} V ${seaY + 6}`} stroke="#6d5636" stroke-width="1.8" />
		{/each}
		{#if i === 0}
			<!-- 항구의 배 -->
			<path d={`M ${bx + side * (len + 9)} ${seaY + 3} h ${side * 12} l ${-side * 3} 5 h ${-side * 7} Z`} fill="#7a5c3a" />
			<path d={`M ${bx + side * (len + 15)} ${seaY + 3} v -9 l ${side * 7} 7 Z`} fill="#c8b89a" />
		{/if}
	{/each}

	<!-- 모아이 석상 실루엣 -->
	<g transform={`translate(${120 - model.islandHalf * 0.55}, ${seaY - 30}) scale(0.16)`} opacity="0.92">
		<path d="M 20 100 L 20 30 Q 20 8 50 8 Q 80 8 80 30 L 80 100 Z" fill="#7d8490" />
		<path d="M 30 42 H 46 M 54 42 H 70" stroke="#1c1a17" stroke-width="6" stroke-linecap="round" />
	</g>
</svg>
