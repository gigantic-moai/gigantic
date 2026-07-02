<script lang="ts">
	import { X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		title,
		onclose,
		wide = false,
		children
	}: { title: string; onclose: () => void; wide?: boolean; children: Snippet } = $props();

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window {onkeydown} />

<div
	class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[6vh] backdrop-blur-[2px]"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
	role="presentation"
>
	<div
		class="panel w-full {wide ? 'max-w-3xl' : 'max-w-xl'} shadow-2xl shadow-black/50"
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<div class="flex items-center justify-between border-b border-moai-border px-5 py-3.5">
			<h2 class="text-sm font-bold">{title}</h2>
			<button class="btn-ghost border-none p-1.5" onclick={onclose} aria-label="닫기">
				<X size={16} />
			</button>
		</div>
		<div class="p-5">
			{@render children()}
		</div>
	</div>
</div>
