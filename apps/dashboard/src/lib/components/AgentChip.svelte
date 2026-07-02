<script lang="ts">
	import type { Agent } from '@gigantic/shared';
	import MoaiAvatar from './MoaiAvatar.svelte';

	let {
		agent,
		size = 20,
		link = true,
		showRole = false
	}: { agent?: Agent; size?: number; link?: boolean; showRole?: boolean } = $props();
</script>

{#if agent}
	{#if link}
		<a
			href={`/agents/${agent.id}`}
			class="inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2 pl-0.5 hover:bg-moai-hover"
			title={`${agent.persona.name} — ${agent.persona.role}`}
		>
			<MoaiAvatar traits={agent.persona.moai} size={size} />
			<span class="text-xs font-medium">{agent.persona.name}</span>
			{#if showRole}<span class="text-[11px] text-moai-dim">{agent.persona.role}</span>{/if}
		</a>
	{:else}
		<span class="inline-flex items-center gap-1.5">
			<MoaiAvatar traits={agent.persona.moai} size={size} />
			<span class="text-xs font-medium">{agent.persona.name}</span>
			{#if showRole}<span class="text-[11px] text-moai-dim">{agent.persona.role}</span>{/if}
		</span>
	{/if}
{:else}
	<span class="inline-flex items-center gap-1.5 text-xs text-moai-dim">
		<span class="flex h-5 w-5 items-center justify-center rounded-full bg-moai-raised text-[10px]">—</span>
		미할당
	</span>
{/if}
