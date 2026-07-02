<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		value,
		sub,
		accent = 'var(--color-moai-text)',
		children
	}: {
		label: string;
		value: string;
		sub?: string;
		accent?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="panel flex flex-col gap-1 px-5 py-4">
	<div class="text-[11px] font-medium tracking-wide text-moai-muted">{label}</div>
	<div class="flex items-end justify-between gap-3">
		<div class="text-2xl leading-none font-bold" style={`color: ${accent}`}>{value}</div>
		{#if children}{@render children()}{/if}
	</div>
	{#if sub}<div class="mt-1 text-[11px] text-moai-dim">{sub}</div>{/if}
</div>
