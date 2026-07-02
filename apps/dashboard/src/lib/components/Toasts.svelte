<script lang="ts">
	import { toasts } from '$lib/stores/toast';
	import { fly } from 'svelte/transition';
	import { CheckCircle2, Info, AlertTriangle, XCircle } from '@lucide/svelte';
</script>

<div class="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-80 flex-col gap-2">
	{#each $toasts as t (t.id)}
		<div
			transition:fly={{ y: 12, duration: 180 }}
			class="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-moai-border-strong bg-moai-raised px-3.5 py-3 text-sm shadow-xl shadow-black/40"
		>
			{#if t.kind === 'ok'}
				<CheckCircle2 size={16} class="mt-0.5 shrink-0 text-ok" />
			{:else if t.kind === 'warn'}
				<AlertTriangle size={16} class="mt-0.5 shrink-0 text-warn" />
			{:else if t.kind === 'danger'}
				<XCircle size={16} class="mt-0.5 shrink-0 text-danger" />
			{:else}
				<Info size={16} class="mt-0.5 shrink-0 text-info" />
			{/if}
			<span class="leading-snug">{t.message}</span>
		</div>
	{/each}
</div>
