<script lang="ts">
	import type { Agent, ReviewComment } from '@gigantic/shared';
	import MoaiAvatar from './MoaiAvatar.svelte';
	import { renderBody, timeAgo } from '$lib/utils';
	import { Reply, Bot, User } from '@lucide/svelte';

	let {
		roots,
		all,
		agents,
		onReply
	}: {
		roots: ReviewComment[];
		all: ReviewComment[];
		agents: Agent[];
		onReply: (parentId: string, body: string) => void | Promise<void>;
	} = $props();

	let replyTarget = $state<string | null>(null);
	let replyBody = $state('');

	const agentOf = (id?: string) => agents.find((a) => a.id === id);
	const repliesOf = (rootId: string) =>
		all.filter((c) => c.parentId === rootId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

	async function submitReply(rootId: string) {
		const body = replyBody.trim();
		if (!body) return;
		replyBody = '';
		replyTarget = null;
		await onReply(rootId, body);
	}
</script>

{#snippet commentCard(c: ReviewComment)}
	<div class="flex gap-2.5">
		{#if c.authorType === 'agent'}
			{@const agent = agentOf(c.authorId)}
			{#if agent}
				<MoaiAvatar traits={agent.persona.moai} size={26} title={agent.persona.name} />
			{:else}
				<span class="flex h-6 w-6 items-center justify-center rounded-full bg-moai-raised"><Bot size={13} /></span>
			{/if}
		{:else}
			<span
				class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-moai-gold-faint text-moai-gold"
				><User size={13} /></span
			>
		{/if}
		<div class="min-w-0 flex-1">
			<div class="flex items-baseline gap-2">
				<span class="text-xs font-bold">{c.authorName}</span>
				<span class="chip !px-1.5 !py-0.5 !text-[9px]">
					{c.authorType === 'agent' ? '에이전트' : '사람'}
				</span>
				<span class="text-[10px] text-moai-dim">{timeAgo(c.createdAt)}</span>
			</div>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- renderBody가 이스케이프 처리 -->
			<p class="mt-1 text-xs leading-relaxed break-words whitespace-pre-wrap text-moai-text">{@html renderBody(c.body)}</p>
		</div>
	</div>
{/snippet}

<div class="flex flex-col gap-3">
	{#each roots as root (root.id)}
		<div class="rounded-lg border border-moai-border bg-moai-surface p-3">
			{@render commentCard(root)}
			{#each repliesOf(root.id) as reply (reply.id)}
				<div class="mt-2.5 ml-6 border-l-2 border-moai-border pl-3">
					{@render commentCard(reply)}
				</div>
			{/each}
			{#if replyTarget === root.id}
				<div class="mt-2.5 ml-6 flex gap-2">
					<!-- svelte-ignore a11y_autofocus -->
					<input
						class="min-w-0 flex-1 rounded-md border border-moai-border-strong bg-moai-bg px-2.5 py-1.5 text-xs outline-none focus:border-moai-gold"
						placeholder="답글 — 에이전트에게 전달됩니다"
						autofocus
						bind:value={replyBody}
						onkeydown={(e) => {
							if (e.key === 'Enter' && !e.isComposing) submitReply(root.id);
							if (e.key === 'Escape') replyTarget = null;
						}}
					/>
					<button class="btn-gold px-3 py-1.5 text-xs" onclick={() => submitReply(root.id)}>답글</button>
				</div>
			{:else}
				<button
					class="mt-2 ml-6 flex items-center gap-1 text-[11px] text-moai-muted hover:text-moai-gold"
					onclick={() => {
						replyTarget = root.id;
						replyBody = '';
					}}
				>
					<Reply size={12} /> 답글
				</button>
			{/if}
		</div>
	{/each}
</div>
