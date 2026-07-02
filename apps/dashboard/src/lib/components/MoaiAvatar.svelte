<script lang="ts">
	import { MOAI_STONES, type MoaiTraits } from '@gigantic/shared';

	let {
		traits,
		size = 48,
		title = ''
	}: { traits: MoaiTraits; size?: number; title?: string } = $props();

	const stone = $derived(MOAI_STONES[traits.stone] ?? MOAI_STONES[0]);
	/** 얼굴폭 5단계 → half width */
	const hw = $derived([20, 24, 28, 32, 36][traits.faceWidth] ?? 28);
	const eyeY = 44;
	const eyeDX = $derived(hw * 0.46);
	const mouthY = 79;
	const mouthW = $derived(Math.max(8, hw * 0.42));
</script>

<svg
	viewBox="0 0 100 108"
	width={size}
	height={size * 1.08}
	role="img"
	aria-label={title || '모아이 아바타'}
	style="flex: none;"
>
	{#if title}<title>{title}</title>{/if}

	<!-- 머리 본체 -->
	<path
		d={`M ${50 - hw} 100
			L ${50 - hw} 30
			Q ${50 - hw} 8 50 8
			Q ${50 + hw} 8 ${50 + hw} 30
			L ${50 + hw} 100
			Z`}
		fill={stone.base}
	/>
	<!-- 우측 음영 -->
	<path
		d={`M ${50 + hw * 0.45} 9.5
			Q ${50 + hw} 10 ${50 + hw} 30
			L ${50 + hw} 100
			L ${50 + hw * 0.45} 100
			Z`}
		fill={stone.shade}
		opacity="0.55"
	/>
	<!-- 좌측 하이라이트 -->
	<path
		d={`M ${50 - hw} 32 Q ${50 - hw} 12 ${50 - hw * 0.5} 9.5 L ${50 - hw * 0.62} 100 L ${50 - hw} 100 Z`}
		fill={stone.light}
		opacity="0.35"
	/>

	<!-- 눈두덩(브로우) -->
	<path
		d={`M ${50 - hw * 0.85} 37 Q ${50 - eyeDX} 31 ${50 - 4} 35 L ${50 - 4} 39 L ${50 - hw * 0.85} 41 Z`}
		fill={stone.shade}
	/>
	<path
		d={`M ${50 + hw * 0.85} 37 Q ${50 + eyeDX} 31 ${50 + 4} 35 L ${50 + 4} 39 L ${50 + hw * 0.85} 41 Z`}
		fill={stone.shade}
	/>

	<!-- 코 -->
	<path
		d={`M ${50 - 3.5} 37 L ${50 + 3.5} 37 L ${50 + 6.5} 63 Q 50 68 ${50 - 6.5} 63 Z`}
		fill={stone.light}
		opacity="0.7"
	/>
	<path d={`M ${50 + 1} 37 L ${50 + 3.5} 37 L ${50 + 6.5} 63 Q ${50 + 3} 65.5 ${50 - 1} 65.8 L ${50 + 1} 45 Z`} fill={stone.shade} opacity="0.4" />

	<!-- 눈 (6종) -->
	{#each [-1, 1] as side (side)}
		{@const ex = 50 + side * eyeDX}
		{#if traits.eyes === 0}
			<!-- 졸린 눈 -->
			<path d={`M ${ex - 6} ${eyeY} L ${ex + 6} ${eyeY}`} stroke="#1c1a17" stroke-width="2.4" stroke-linecap="round" fill="none" />
			<path d={`M ${ex - 4} ${eyeY + 3} A 4.5 4.5 0 0 0 ${ex + 4} ${eyeY + 3}`} fill="#1c1a17" opacity="0.85" />
		{:else if traits.eyes === 1}
			<!-- 화난 눈 -->
			<path
				d={`M ${ex - side * 6} ${eyeY - 4} L ${ex + side * 6} ${eyeY + 1.5}`}
				stroke="#1c1a17"
				stroke-width="2.6"
				stroke-linecap="round"
				fill="none"
			/>
			<circle cx={ex + side * 2} cy={eyeY + 4} r="2.1" fill="#1c1a17" />
		{:else if traits.eyes === 2}
			<!-- 동그란 눈 -->
			<circle cx={ex} cy={eyeY + 1} r="4.4" fill="#1c1a17" />
			<circle cx={ex} cy={eyeY + 1} r="1.6" fill={stone.light} opacity="0.5" />
		{:else if traits.eyes === 3}
			<!-- 가늘게 뜬 눈 -->
			<rect x={ex - 6} y={eyeY - 0.5} width="12" height="2.6" rx="1.3" fill="#1c1a17" />
		{:else if traits.eyes === 4}
			<!-- 반짝이는 눈 -->
			<circle cx={ex} cy={eyeY + 1} r="4.2" fill="#1c1a17" />
			<circle cx={ex + 1.6} cy={eyeY - 0.6} r="1.4" fill="#fff" />
			<circle cx={ex - 1.8} cy={eyeY + 2.4} r="0.8" fill="#fff" opacity="0.8" />
		{:else}
			<!-- 감은 눈 -->
			<path
				d={`M ${ex - 6} ${eyeY} Q ${ex} ${eyeY + 4.5} ${ex + 6} ${eyeY}`}
				stroke="#1c1a17"
				stroke-width="2.2"
				stroke-linecap="round"
				fill="none"
			/>
		{/if}
	{/each}

	<!-- 입 (5종) -->
	{#if traits.mouth === 0}
		<path d={`M ${50 - mouthW} ${mouthY} L ${50 + mouthW} ${mouthY}`} stroke="#1c1a17" stroke-width="2.4" stroke-linecap="round" fill="none" />
	{:else if traits.mouth === 1}
		<path
			d={`M ${50 - mouthW} ${mouthY + 2} Q 50 ${mouthY - 4} ${50 + mouthW} ${mouthY + 2}`}
			stroke="#1c1a17"
			stroke-width="2.4"
			stroke-linecap="round"
			fill="none"
		/>
	{:else if traits.mouth === 2}
		<path
			d={`M ${50 - mouthW} ${mouthY - 2} Q 50 ${mouthY + 5} ${50 + mouthW} ${mouthY - 2}`}
			stroke="#1c1a17"
			stroke-width="2.4"
			stroke-linecap="round"
			fill="none"
		/>
	{:else if traits.mouth === 3}
		<ellipse cx="50" cy={mouthY} rx="4" ry="5.2" fill="#1c1a17" />
	{:else}
		<path d={`M ${50 - mouthW} ${mouthY} L ${50 + mouthW} ${mouthY}`} stroke="#1c1a17" stroke-width="3.4" stroke-linecap="round" fill="none" />
		<path d={`M ${50 - mouthW} ${mouthY - 3} L ${50 - mouthW} ${mouthY + 3} M ${50 + mouthW} ${mouthY - 3} L ${50 + mouthW} ${mouthY + 3}`} stroke="#1c1a17" stroke-width="1.6" stroke-linecap="round" fill="none" />
	{/if}

	<!-- 악세서리 (6종) -->
	{#if traits.accessory === 1}
		<!-- 균열 흉터 -->
		<path
			d={`M ${50 - hw * 0.55} 12 L ${50 - hw * 0.35} 22 L ${50 - hw * 0.6} 30 L ${50 - hw * 0.4} 40 L ${50 - hw * 0.62} 52`}
			stroke={stone.shade}
			stroke-width="2"
			stroke-linecap="round"
			fill="none"
		/>
	{:else if traits.accessory === 2}
		<!-- 이끼 -->
		<ellipse cx={50 - hw * 0.4} cy="97" rx={hw * 0.42} ry="4.5" fill="#5f7a4a" opacity="0.9" />
		<ellipse cx={50 + hw * 0.5} cy="99" rx={hw * 0.36} ry="4" fill="#6f8f57" opacity="0.85" />
		<ellipse cx={50 + hw * 0.3} cy="11" rx={hw * 0.32} ry="3.4" fill="#6f8f57" opacity="0.9" />
	{:else if traits.accessory === 3}
		<!-- 화관 -->
		{#each [-2, -1, 0, 1, 2] as i (i)}
			{@const fx = 50 + i * hw * 0.38}
			{@const fy = 10 - Math.abs(i) * -0.5 + (Math.abs(i) === 2 ? 3.5 : Math.abs(i) === 1 ? 1 : 0)}
			<circle cx={fx} cy={fy} r="3.6" fill={i % 2 === 0 ? '#e8b4c8' : '#f0d878'} />
			<circle cx={fx} cy={fy} r="1.4" fill="#a8642a" />
		{/each}
	{:else if traits.accessory === 4}
		<!-- 모노클 -->
		<circle cx={50 + eyeDX} cy={eyeY + 1} r="8.4" fill="none" stroke="#c8a44e" stroke-width="1.8" />
		<path d={`M ${50 + eyeDX + 7} ${eyeY + 6} Q ${50 + eyeDX + 11} ${eyeY + 14} ${50 + eyeDX + 9} ${eyeY + 22}`} stroke="#c8a44e" stroke-width="1.2" fill="none" />
	{:else if traits.accessory === 5}
		<!-- 귀 장식 -->
		<rect x={50 - hw - 3} y="50" width="5" height="14" rx="2.5" fill="#c8a44e" />
		<rect x={50 + hw - 2} y="50" width="5" height="14" rx="2.5" fill="#c8a44e" />
		<circle cx={50 - hw - 0.5} cy="67" r="2.2" fill="#e2bd63" />
		<circle cx={50 + hw + 0.5} cy="67" r="2.2" fill="#e2bd63" />
	{/if}
</svg>
