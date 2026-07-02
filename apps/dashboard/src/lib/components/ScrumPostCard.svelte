<script lang="ts">
	import type { Agent, ScrumPost } from '@gigantic/shared';
	import MoaiAvatar from './MoaiAvatar.svelte';
	import { renderBody, formatTime } from '$lib/utils';
	import { MessageSquare, SmilePlus, User } from '@lucide/svelte';

	let {
		post,
		replies,
		agents,
		onReact,
		onReply
	}: {
		post: ScrumPost;
		replies: ScrumPost[];
		agents: Agent[];
		onReact: (postId: string, emoji: string) => void | Promise<void>;
		onReply: (parentId: string, body: string) => void | Promise<void>;
	} = $props();

	const QUICK_EMOJIS = ['🗿', '👍', '🔥', '😂', '👀', '🙏', '💡', '🎉'];

	let showPicker = $state<string | null>(null);
	let replyOpen = $state(false);
	let replyBody = $state('');

	const agentOf = (id?: string) => agents.find((a) => a.id === id);
	const nameOf = (by: string) => {
		if (by.startsWith('human:')) return by.slice(6) + ' (사람)';
		return agentOf(by)?.persona.name ?? by;
	};

	async function submitReply() {
		const body = replyBody.trim();
		if (!body) return;
		replyBody = '';
		replyOpen = false;
		await onReply(post.id, body);
	}
</script>

{#snippet postBlock(p: ScrumPost, isReply: boolean)}
	{@const agent = agentOf(p.authorId)}
	<div class="flex gap-3">
		{#if p.authorType === 'agent' && agent}
			<a href={`/agents/${agent.id}`} title={agent.persona.role} class="shrink-0">
				<MoaiAvatar traits={agent.persona.moai} size={isReply ? 28 : 38} title={agent.persona.name} />
			</a>
		{:else}
			<span
				class="flex {isReply ? 'h-7 w-7' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-full bg-moai-gold-faint text-moai-gold"
			>
				<User size={isReply ? 13 : 16} />
			</span>
		{/if}
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
				<span class="text-[13px] font-bold">{p.authorName}</span>
				{#if p.authorType === 'agent' && agent}
					<span class="text-[10px] text-moai-dim">{agent.persona.role}</span>
				{:else}
					<span class="chip !px-1.5 !py-0.5 !text-[9px]">사람</span>
				{/if}
				<span class="text-[10px] text-moai-dim">{formatTime(p.createdAt)}</span>
			</div>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- renderBody가 이스케이프 처리 -->
			<p class="mt-1.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap">{@html renderBody(p.body)}</p>

			<!-- 리액션 -->
			<div class="mt-2 flex flex-wrap items-center gap-1.5">
				{#each p.reactions as r (r.emoji)}
					<button
						class="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors {r.by.includes('human:PO')
							? 'border-moai-gold bg-moai-gold-faint'
							: 'border-moai-border-strong bg-moai-raised hover:bg-moai-hover'}"
						title={r.by.map(nameOf).join(', ')}
						onclick={() => onReact(p.id, r.emoji)}
					>
						<span>{r.emoji}</span>
						<span class="text-moai-muted">{r.by.length}</span>
					</button>
				{/each}
				<div class="relative">
					<button
						class="flex h-6 w-6 items-center justify-center rounded-full text-moai-dim hover:bg-moai-hover hover:text-moai-gold"
						aria-label="리액션 추가"
						onclick={() => (showPicker = showPicker === p.id ? null : p.id)}
					>
						<SmilePlus size={13} />
					</button>
					{#if showPicker === p.id}
						<div class="absolute top-7 left-0 z-10 flex gap-0.5 rounded-lg border border-moai-border-strong bg-moai-raised p-1.5 shadow-xl">
							{#each QUICK_EMOJIS as e (e)}
								<button
									class="rounded p-1 text-sm hover:bg-moai-hover"
									onclick={() => {
										showPicker = null;
										onReact(p.id, e);
									}}
								>
									{e}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/snippet}

<article class="panel p-4">
	{@render postBlock(post, false)}

	{#if replies.length > 0}
		<div class="mt-3 ml-5 flex flex-col gap-3 border-l-2 border-moai-border pl-4">
			{#each replies as r (r.id)}
				{@render postBlock(r, true)}
			{/each}
		</div>
	{/if}

	<div class="mt-3 ml-12">
		{#if replyOpen}
			<div class="flex gap-2">
				<!-- svelte-ignore a11y_autofocus -->
				<input
					class="min-w-0 flex-1 rounded-md border border-moai-border-strong bg-moai-bg px-3 py-1.5 text-xs outline-none focus:border-moai-gold"
					placeholder="스레드에 답글 — @멘션하면 에이전트가 답합니다"
					autofocus
					bind:value={replyBody}
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.isComposing) submitReply();
						if (e.key === 'Escape') replyOpen = false;
					}}
				/>
				<button class="btn-gold px-3 py-1.5 text-xs" onclick={submitReply}>답글</button>
			</div>
		{:else}
			<button
				class="flex items-center gap-1.5 text-[11px] text-moai-dim hover:text-moai-gold"
				onclick={() => (replyOpen = true)}
			>
				<MessageSquare size={12} /> 스레드에 답글
			</button>
		{/if}
	</div>
</article>
