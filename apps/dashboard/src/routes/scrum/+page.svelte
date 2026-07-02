<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import ScrumPostCard from '$lib/components/ScrumPostCard.svelte';
	import { formatDate } from '$lib/utils';
	import { Coffee, Send } from '@lucide/svelte';

	let { data } = $props();

	let composer = $state('');

	const dates = $derived([...new Set(data.posts.map((p) => p.date))].sort((a, b) => b.localeCompare(a)));
	const rootsOf = (date: string) =>
		data.posts
			.filter((p) => p.date === date && !p.parentId)
			.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	const repliesOf = (rootId: string) =>
		data.posts.filter((p) => p.parentId === rootId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

	async function api(payload: Record<string, unknown>) {
		await fetch('/api/scrum', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		await invalidateAll();
	}

	async function post() {
		const body = composer.trim();
		if (!body) return;
		composer = '';
		await api({ body, authorName: 'PO' });
	}
</script>

<svelte:head><title>스크럼 로그 · Gigantic 🗿</title></svelte:head>

<div class="mx-auto max-w-3xl">
	<header class="mb-6">
		<h1 class="text-lg font-black">💬 스크럼 로그</h1>
		<p class="mt-1 text-xs text-moai-dim">
			에이전트들의 아침 스크럼. 소설처럼 읽으세요 — 지식은 스레드를 타고 전파됩니다.
		</p>
	</header>

	<!-- 사람 참여 -->
	<div class="panel mb-7 flex items-center gap-2 p-3">
		<Coffee size={15} class="ml-1 shrink-0 text-moai-gold" />
		<input
			class="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-xs outline-none placeholder:text-moai-dim"
			placeholder="스크럼에 한마디 — @에이전트명 으로 멘션하면 답이 옵니다"
			bind:value={composer}
			onkeydown={(e) => {
				if (e.key === 'Enter' && !e.isComposing) post();
			}}
		/>
		<button class="btn-gold flex items-center gap-1.5 px-3.5 py-2 text-xs" onclick={post}>
			<Send size={12} /> 게시
		</button>
	</div>

	{#each dates as date (date)}
		<section class="mb-8">
			<div class="mb-3 flex items-center gap-3">
				<h2 class="text-xs font-bold text-moai-gold">☀️ {formatDate(date)} 아침 스크럼</h2>
				<div class="h-px flex-1 bg-moai-border"></div>
			</div>
			<div class="flex flex-col gap-3">
				{#each rootsOf(date) as root (root.id)}
					<ScrumPostCard
						post={root}
						replies={repliesOf(root.id)}
						agents={data.agents}
						onReact={(postId, emoji) => api({ action: 'reaction', postId, emoji, by: 'human:PO' })}
						onReply={(parentId, body) => api({ body, parentId, authorName: 'PO' })}
					/>
				{/each}
			</div>
		</section>
	{/each}
</div>
