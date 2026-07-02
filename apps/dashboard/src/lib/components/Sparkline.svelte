<script lang="ts">
	let {
		data,
		width = 120,
		height = 36,
		color = 'var(--color-moai-gold)',
		unit = ''
	}: { data: number[]; width?: number; height?: number; color?: string; unit?: string } = $props();

	const geom = $derived.by(() => {
		if (data.length === 0) return { line: '', area: '', points: [] as { x: number; y: number }[] };
		const min = Math.min(...data);
		const max = Math.max(...data);
		const span = max - min || 1;
		const pad = 4;
		const points = data.map((v, i) => ({
			x: pad + (i / Math.max(1, data.length - 1)) * (width - pad * 2),
			y: height - pad - ((v - min) / span) * (height - pad * 2)
		}));
		const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
		const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;
		return { line, area, points };
	});
</script>

<svg viewBox={`0 0 ${width} ${height}`} {width} {height} aria-hidden="true">
	{#if geom.line}
		<path d={geom.area} fill={color} opacity="0.12" />
		<path d={geom.line} fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" />
		{#if geom.points.length > 0}
			{@const last = geom.points[geom.points.length - 1]}
			<circle cx={last.x} cy={last.y} r="2.4" fill={color} />
		{/if}
	{/if}
</svg>
{#if unit && data.length > 0}
	<span class="sr-only">{data[data.length - 1]}{unit}</span>
{/if}
