<script lang="ts">
	import { page } from '$app/state';

	const is404 = $derived(page.status === 404);
</script>

<svelte:head><title>{page.status} · Gigantic 🗿</title></svelte:head>

<div class="flex min-h-[70vh] items-center justify-center">
	<div class="text-center">
		<!-- 쓰러진 모아이 -->
		<div class="inline-block {is404 ? 'rotate-90' : ''} text-6xl transition-transform">🗿</div>
		<h1 class="mt-5 text-2xl font-black text-moai-gold">{page.status}</h1>
		<p class="mt-2 text-sm text-moai-muted">
			{#if is404}
				이 섬에는 그런 페이지가 없습니다 — 채석장까지 다 뒤져봤는데도요.
			{:else}
				문제가 생겼습니다: {page.error?.message ?? '알 수 없는 오류'}
			{/if}
		</p>
		<div class="mt-6 flex justify-center gap-2">
			<a href="/overview" class="btn-gold px-4 py-2 text-xs">프로젝트 오버뷰로</a>
			<button class="btn-ghost px-4 py-2 text-xs" onclick={() => history.back()}>이전 페이지</button>
		</div>
	</div>
</div>
