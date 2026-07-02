<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		Columns3,
		Globe2,
		GitFork,
		LogOut,
		SearchCode,
		BookOpen,
		MessagesSquare,
		Settings,
		Zap
	} from '@lucide/svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import { applyTheme } from '$lib/theme';
	import { startRealtime, onRealtimeEvent, connected } from '$lib/stores/realtime';
	import { toast } from '$lib/stores/toast';

	let { data, children } = $props();

	let settingsOpen = $state(false);

	const nav = $derived([
		{ href: '/overview', label: '프로젝트 오버뷰', icon: Globe2, badge: 0 },
		{ href: '/kanban', label: '칸반보드', icon: Columns3, badge: 0 },
		{ href: '/waterfall', label: '워터폴 보드', icon: GitFork, badge: 0 },
		{ href: '/review', label: '리뷰창', icon: SearchCode, badge: data.nav.pendingReviews },
		{ href: '/wiki', label: '지식 위키', icon: BookOpen, badge: data.nav.pendingKnowledge },
		{ href: '/scrum', label: '스크럼 로그', icon: MessagesSquare, badge: 0 },
		{ href: '/agents', label: '에이전트 관리', icon: Zap, badge: data.nav.awaitingAgents }
	]);

	onMount(() => {
		applyTheme(data.settings.theme); // 서버 설정 기준으로 테마 동기화
		startRealtime();
		return onRealtimeEvent((e) => {
			if (e.type === 'toast') toast(e.message, e.kind ?? 'info');
		});
	});
</script>

<div class="flex min-h-screen">
	<!-- 사이드바 (md+) -->
	<aside
		class="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-moai-border bg-moai-surface md:flex"
	>
		<a href="/overview" class="flex items-center gap-2.5 px-5 py-5">
			<span class="text-2xl">🗿</span>
			<div>
				<div class="text-sm leading-none font-black tracking-wide text-moai-gold">GIGANTIC</div>
				<div class="mt-1 text-[10px] text-moai-dim">UE Agentic Dev Platform</div>
			</div>
		</a>
		<nav class="flex flex-1 flex-col gap-0.5 px-3">
			{#each nav as item (item.href)}
				{@const active = page.url.pathname.startsWith(item.href)}
				<a
					href={item.href}
					class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors {active
						? 'bg-moai-gold-faint font-semibold text-moai-gold'
						: 'text-moai-muted hover:bg-moai-hover hover:text-moai-text'}"
				>
					<item.icon size={15} />
					<span class="flex-1">{item.label}</span>
					{#if item.badge > 0}
						<span class="rounded-full bg-moai-gold px-1.5 py-0.5 text-[10px] leading-none font-bold text-[#17130a]">
							{item.badge}
						</span>
					{/if}
				</a>
			{/each}
		</nav>
		<div class="px-3 pb-1">
			<button
				class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-moai-muted transition-colors hover:bg-moai-hover hover:text-moai-text"
				onclick={() => (settingsOpen = true)}
			>
				<Settings size={15} />
				<span class="flex-1 text-left">환경설정</span>
			</button>
			{#if data.authEnabled}
				<button
					class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-moai-muted transition-colors hover:bg-moai-hover hover:text-moai-text"
					onclick={async () => {
						await fetch('/api/logout', { method: 'POST' });
						location.href = '/login';
					}}
				>
					<LogOut size={15} />
					<span class="flex-1 text-left">로그아웃</span>
				</button>
			{/if}
		</div>
		<div class="border-t border-moai-border px-5 py-3.5 text-[10px] text-moai-dim">
			<div class="flex items-center gap-1.5">
				<span class="h-1.5 w-1.5 rounded-full {$connected ? 'bg-ok' : 'bg-moai-dim'}"></span>
				실시간 {$connected ? '연결됨' : '연결 대기'}
			</div>
			<div class="mt-1.5">Perforce: <span class="font-mono">{data.settings.p4.depot}</span></div>
			<div class="mt-0.5">
				저장소:
				<span class="font-mono">
					{data.storage === 'postgres' ? 'PostgreSQL' : data.storage === 'pglite' ? 'PGlite (내장)' : '인메모리 mock'}
				</span>
			</div>
			<div class="mt-0.5">밤에는 에이전트가, 아침에는 사람이 🗿</div>
		</div>
	</aside>

	<!-- 모바일 상단 네비 -->
	<header
		class="fixed inset-x-0 top-0 z-40 flex items-center gap-1 overflow-x-auto border-b border-moai-border bg-moai-surface px-3 py-2 md:hidden"
	>
		<a href="/overview" class="mr-1 text-xl">🗿</a>
		{#each nav as item (item.href)}
			{@const active = page.url.pathname.startsWith(item.href)}
			<a
				href={item.href}
				class="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] whitespace-nowrap {active
					? 'bg-moai-gold-faint font-semibold text-moai-gold'
					: 'text-moai-muted'}"
			>
				<item.icon size={12} />
				{item.label}
				{#if item.badge > 0}
					<span class="rounded-full bg-moai-gold px-1 text-[9px] font-bold text-[#17130a]">{item.badge}</span>
				{/if}
			</a>
		{/each}
		<button
			class="ml-auto flex items-center rounded-md px-2 py-1.5 text-moai-muted"
			aria-label="환경설정"
			onclick={() => (settingsOpen = true)}
		>
			<Settings size={14} />
		</button>
	</header>

	<main class="min-w-0 flex-1 px-4 pt-16 pb-10 sm:px-6 md:ml-60 md:pt-6">
		{@render children()}
	</main>
</div>

{#if settingsOpen}
	<SettingsModal settings={data.settings} onclose={() => (settingsOpen = false)} />
{/if}

<Toasts />
