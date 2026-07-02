<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { KNOWLEDGE_CATEGORY_META, type KnowledgeCategory } from '@gigantic/shared';
	import DebuggerPanel from '$lib/components/DebuggerPanel.svelte';
	import MoaiAvatar from '$lib/components/MoaiAvatar.svelte';
	import OnboardingPanel from '$lib/components/OnboardingPanel.svelte';
	import ScheduleEditor from '$lib/components/ScheduleEditor.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { liveAgents } from '$lib/stores/realtime';
	import { timeAgo } from '$lib/utils';
	import { ArrowLeft, FolderGit2, Pause, Play, ShieldAlert } from '@lucide/svelte';

	let { data } = $props();

	const agent = $derived(data.agent);
	const l = $derived($liveAgents.get(agent.id));
	const status = $derived((l?.status as typeof agent.status) ?? agent.status);
	const CATS = Object.keys(KNOWLEDGE_CATEGORY_META) as KnowledgeCategory[];

	async function togglePause() {
		await fetch(`/api/agents/${agent.id}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ action: 'toggle-pause' })
		});
		await invalidateAll();
	}

	const clStatusLabel: Record<string, string> = {
		open: '리뷰 대기',
		approved: '머지 중',
		merged: '머지됨',
		rejected: '반려',
		'changes-requested': '수정 요청',
		blocked: '머지 차단'
	};
</script>

<svelte:head><title>{agent.persona.name} · 에이전트 · Gigantic 🗿</title></svelte:head>

<div class="mx-auto max-w-5xl">
	<a href="/agents" class="mb-4 inline-flex items-center gap-1.5 text-xs text-moai-muted hover:text-moai-gold">
		<ArrowLeft size={13} /> 에이전트 목록
	</a>

	<!-- 헤더 -->
	<header class="panel flex flex-wrap items-start gap-5 p-6">
		<MoaiAvatar traits={agent.persona.moai} size={96} title={agent.persona.name} />
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2.5">
				<h1 class="text-xl font-black">{agent.persona.name}</h1>
				<StatusBadge {status} />
				{#if !['onboarding', 'awaiting-approval'].includes(status)}
					<button class="btn-ghost flex items-center gap-1 px-2.5 py-1 text-[11px]" onclick={togglePause}>
						{#if status === 'paused'}<Play size={11} /> 재개{:else}<Pause size={11} /> 일시 정지{/if}
					</button>
				{/if}
			</div>
			<div class="mt-1 text-xs text-moai-muted">{agent.persona.role}</div>
			<p class="mt-2.5 max-w-xl text-xs leading-relaxed text-moai-dim">{agent.persona.personality}</p>
			<div class="mt-3 flex flex-wrap gap-1">
				{#each agent.persona.tags as t (t)}<span class="chip">{t}</span>{/each}
			</div>
			<div class="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-moai-dim">
				<span class="flex items-center gap-1.5"><FolderGit2 size={11} /> <span class="font-mono">{agent.p4Workspace}</span></span>
				{#if agent.spawnedAt}<span>스폰: {timeAgo(agent.spawnedAt)}</span>{/if}
				<span>하트비트: {timeAgo(l ? new Date().toISOString() : agent.lastHeartbeat)}</span>
			</div>
			<div class="mt-2 rounded-md border border-moai-border bg-moai-surface px-3 py-2 text-[11px] text-moai-muted">
				{l?.activity ?? agent.activity ?? '대기 중'}
				{#if status === 'night-work' && (l?.progress ?? agent.progress) !== undefined}
					<span class="ml-2 font-mono text-night">{l?.progress ?? agent.progress}%</span>
				{/if}
			</div>
		</div>

		<!-- 통계 -->
		<div class="grid shrink-0 grid-cols-3 gap-2 text-center">
			<div class="rounded-lg border border-moai-border bg-moai-surface px-3 py-2">
				<div class="text-base font-bold">{agent.stats.issuesDone}</div>
				<div class="text-[9px] text-moai-dim">완료 이슈</div>
			</div>
			<div class="rounded-lg border border-moai-border bg-moai-surface px-3 py-2">
				<div class="text-base font-bold">{agent.stats.changelists}</div>
				<div class="text-[9px] text-moai-dim">서밋 CL</div>
			</div>
			<div class="rounded-lg border border-moai-border bg-moai-surface px-3 py-2">
				<div class="text-base font-bold">{agent.stats.trunkFixes}</div>
				<div class="text-[9px] text-moai-dim">트렁크 수정</div>
			</div>
		</div>
	</header>

	<div class="mt-5 grid gap-5 lg:grid-cols-2">
		<!-- 온보딩 or 지식 기여 -->
		{#if ['onboarding', 'awaiting-approval'].includes(agent.status)}
			<OnboardingPanel {agent} />
		{:else}
			<section class="panel p-5">
				<h3 class="text-sm font-bold">📚 {agent.persona.name}의 지식</h3>
				<p class="mt-0.5 text-[11px] text-moai-dim">
					온보딩 때 학습한 지식과 작업하며 발견한 지식. 발견한 지식이 승인되면
					<a href="/overview" class="text-moai-gold hover:underline">🏝️ 프로젝트 섬</a>이 성장합니다.
				</p>
				<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
					{#each CATS as cat (cat)}
						<div class="rounded-md border border-moai-border bg-moai-surface px-2 py-2 text-center">
							<div class="text-sm font-bold">{agent.stats.knowledge[cat]}</div>
							<div class="mt-0.5 text-[9px] text-moai-dim">{KNOWLEDGE_CATEGORY_META[cat].emoji} {KNOWLEDGE_CATEGORY_META[cat].label}</div>
						</div>
					{/each}
				</div>
				{#if agent.onboarding.changesetsAnalyzed}
					<div class="mt-3 text-[11px] text-moai-dim">
						온보딩 때 정독한 changeset
						<span class="font-mono font-semibold text-moai-muted">{agent.onboarding.changesetsAnalyzed.toLocaleString()}</span>개
						· 스크럼과 리뷰를 통해 계속 학습 중
					</div>
				{/if}
			</section>
		{/if}

		<!-- 스케줄 -->
		<ScheduleEditor {agent} />
	</div>

	<!-- 디버거 (Quilla 임베드 지점) -->
	<div class="mt-5">
		<DebuggerPanel {agent} />
	</div>

	<div class="mt-5 mb-10 grid gap-5 lg:grid-cols-2">
		<!-- 할당 이슈 -->
		<section class="panel">
			<div class="border-b border-moai-border px-4 py-3 text-xs font-bold">할당된 이슈 — {data.assignedIssues.length}</div>
			<div class="divide-y divide-moai-border/60">
				{#each data.assignedIssues as issue (issue.id)}
					<div class="flex items-center gap-2.5 px-4 py-2.5 text-xs">
						<span class="font-mono font-bold text-moai-gold">{issue.key}</span>
						<span class="min-w-0 flex-1 truncate">{issue.title}</span>
						<span class="chip">{issue.status}</span>
					</div>
				{:else}
					<div class="px-4 py-5 text-center text-[11px] text-moai-dim">할당된 이슈 없음 — 전문 태그 매칭 대기</div>
				{/each}
			</div>
		</section>

		<!-- 최근 changelist -->
		<section class="panel">
			<div class="border-b border-moai-border px-4 py-3 text-xs font-bold">서밋한 changelist</div>
			<div class="divide-y divide-moai-border/60">
				{#each [...data.changelists].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as cl (cl.id)}
					<a href={`/review/${cl.id}`} class="flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-moai-hover">
						<span class="font-mono font-bold text-moai-gold">CL {cl.number}</span>
						<span class="min-w-0 flex-1 truncate">{cl.title}</span>
						{#if cl.contractViolations.length > 0}
							<ShieldAlert size={12} class="shrink-0 text-danger" />
						{/if}
						<span class="chip">{clStatusLabel[cl.status] ?? cl.status}</span>
					</a>
				{:else}
					<div class="px-4 py-5 text-center text-[11px] text-moai-dim">아직 서밋한 changelist가 없습니다</div>
				{/each}
			</div>
		</section>
	</div>

	<!-- 이 에이전트가 발견한 지식 -->
	{#if data.knowledge.length > 0}
		<section class="panel mb-10">
			<div class="border-b border-moai-border px-4 py-3 text-xs font-bold">발견한 지식 — 스크럼 {data.scrumCount}회 참여</div>
			<div class="divide-y divide-moai-border/60">
				{#each data.knowledge as k (k.id)}
					<a href="/wiki" class="flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-moai-hover">
						<span>{KNOWLEDGE_CATEGORY_META[k.category].emoji}</span>
						<span class="min-w-0 flex-1 truncate">{k.title}</span>
						<span
							class="chip {k.status === 'approved'
								? '!border-ok/40 !text-ok'
								: k.status === 'pending'
									? '!border-warn/40 !text-warn'
									: '!border-danger/40 !text-danger'}"
						>
							{k.status === 'approved' ? '정식 지식' : k.status === 'pending' ? '승인 대기' : '반려'}
						</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>
