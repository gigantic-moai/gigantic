<script lang="ts">
	import KpiCard from '$lib/components/KpiCard.svelte';
	import Sparkline from '$lib/components/Sparkline.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import MoaiAvatar from '$lib/components/MoaiAvatar.svelte';
	import IslandView from '$lib/components/IslandView.svelte';
	import { KNOWLEDGE_CATEGORY_META, type KnowledgeCategory } from '@gigantic/shared';
	import { islandDescription } from '$lib/island';
	import { timeAgo } from '$lib/utils';
	import { liveAgents } from '$lib/stores/realtime';
	import { CheckCircle2, XCircle, ShieldAlert, GitMerge } from '@lucide/svelte';

	let { data } = $props();

	const rate = $derived(data.kpis.buildSuccessRate.at(-1) ?? 0);
	const agentOf = (id: string) => data.agents.find((a) => a.id === id);
	const live = (id: string) => $liveAgents.get(id);
	const CATS = Object.keys(KNOWLEDGE_CATEGORY_META) as KnowledgeCategory[];
	const installedDate = $derived(
		new Date(data.project.installedAt).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);
</script>

<svelte:head><title>프로젝트 오버뷰 · Gigantic 🗿</title></svelte:head>

<div class="mx-auto max-w-6xl">
	<header class="mb-6">
		<h1 class="text-lg font-black">🌐 프로젝트 오버뷰</h1>
		<p class="mt-1 text-xs text-moai-dim">어젯밤 에이전트들이 일했고, 지금 리뷰가 당신을 기다립니다.</p>
	</header>

	{#if data.kpis.contractViolations > 0}
		<div class="mb-5 flex items-center gap-3 rounded-xl border border-danger/35 bg-danger/8 px-4 py-3">
			<ShieldAlert size={17} class="shrink-0 text-danger" />
			<div class="text-xs">
				<span class="font-bold text-danger">계약 위반 {data.kpis.contractViolations}건</span>
				<span class="text-moai-muted">
					— 머지가 차단된 changelist가 있습니다.
					{#each data.blockedCls as cl (cl.id)}
						<a href={`/review/${cl.id}`} class="ml-1 font-mono text-moai-gold hover:underline">CL {cl.number}</a>
					{/each}
				</span>
			</div>
		</div>
	{/if}

	<!-- KPI -->
	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
		<KpiCard label="열린 이슈" value={String(data.kpis.openIssues)} sub="To Do · In Progress · Review" />
		<KpiCard
			label="가동 중인 에이전트"
			value={`${data.kpis.activeAgents}/${data.kpis.totalAgents}`}
			sub="🌙 야간 작업 + ☀️ 트렁크 감시"
			accent="var(--color-night)"
		/>
		<KpiCard
			label="빌드 성공률 (7일)"
			value={`${rate}%`}
			sub={`오늘 빌드 ${data.kpis.buildsToday.total}회 · 실패 ${data.kpis.buildsToday.failed}회`}
			accent={rate >= 90 ? 'var(--color-ok)' : 'var(--color-warn)'}
		>
			<Sparkline data={data.kpis.buildSuccessRate} width={96} height={30} color={rate >= 90 ? 'var(--color-ok)' : 'var(--color-warn)'} />
		</KpiCard>
		<KpiCard label="리뷰 대기" value={String(data.kpis.pendingReviews)} sub={`지식 승인 대기 ${data.kpis.pendingKnowledge}건`} accent="var(--color-moai-gold)" />
	</div>

	<!-- 🏝️ 프로젝트 섬 — 설치 시 전체 서밋을 둘러보며 축적된 지식이 섬을 만들었다 -->
	<section class="panel mt-5 flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
		<div class="flex shrink-0 justify-center rounded-lg border border-moai-border bg-moai-bg px-3 py-2">
			<IslandView island={data.project.island} width={300} />
		</div>
		<div class="min-w-0 flex-1">
			<h2 class="text-sm font-bold">🏝️ 프로젝트 섬</h2>
			<p class="mt-0.5 text-[11px] text-moai-gold">{islandDescription(data.project.island)}</p>
			<p class="mt-2 text-[11px] leading-relaxed text-moai-muted">
				{installedDate} Gigantic 설치 — 그동안의 서밋
				<span class="font-mono font-semibold text-moai-text">{data.project.changesetsAnalyzed.toLocaleString()}</span>개를
				전부 둘러보며 지식을 축적했고, 축적이 완료되며 이 섬이 만들어졌습니다.
				<a href="/wiki" class="text-moai-gold hover:underline">지식</a>이 승인될 때마다 섬은 계속 성장합니다.
			</p>
			<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
				{#each CATS as cat (cat)}
					<div class="rounded-md border border-moai-border bg-moai-surface px-2 py-2 text-center">
						<div class="text-sm font-bold">{data.project.knowledge[cat]}</div>
						<div class="mt-0.5 text-[9px] text-moai-dim">
							{KNOWLEDGE_CATEGORY_META[cat].emoji} {KNOWLEDGE_CATEGORY_META[cat].label}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<div class="mt-5 grid gap-5 lg:grid-cols-5">
		<!-- 에이전트 상태 -->
		<section class="panel lg:col-span-2">
			<div class="border-b border-moai-border px-4 py-3 text-xs font-bold">에이전트 실시간 상태</div>
			<div class="flex flex-col">
				{#each data.agents as agent (agent.id)}
					{@const l = live(agent.id)}
					<a
						href={`/agents/${agent.id}`}
						class="flex items-center gap-3 border-b border-moai-border/60 px-4 py-3 last:border-none hover:bg-moai-hover"
					>
						<MoaiAvatar traits={agent.persona.moai} size={34} title={agent.persona.name} />
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="text-xs font-bold">{agent.persona.name}</span>
								<StatusBadge status={(l?.status as never) ?? agent.status} size="sm" />
							</div>
							<div class="mt-0.5 truncate text-[11px] text-moai-dim">
								{l?.activity ?? agent.activity ?? '—'}
							</div>
						</div>
						{#if (l?.progress ?? agent.progress) !== undefined}
							<span class="font-mono text-[11px] text-moai-gold">{l?.progress ?? agent.progress}%</span>
						{/if}
					</a>
				{/each}
			</div>
		</section>

		<!-- 최근 머지 이력 -->
		<section class="panel lg:col-span-3">
			<div class="flex items-center gap-2 border-b border-moai-border px-4 py-3 text-xs font-bold">
				<GitMerge size={13} class="text-moai-gold" /> 최근 머지 이력
			</div>
			<table class="w-full text-xs">
				<tbody>
					{#each data.kpis.recentMerges as m (m.changelistNumber)}
						{@const agent = agentOf(m.agentId)}
						<tr class="border-b border-moai-border/60 last:border-none">
							<td class="px-4 py-2.5 font-mono whitespace-nowrap text-moai-gold">CL {m.changelistNumber}</td>
							<td class="w-full min-w-0 px-2 py-2.5">
								<div class="line-clamp-1">{m.title}</div>
							</td>
							<td class="px-2 py-2.5">
								{#if agent}
									<span class="flex items-center gap-1.5 whitespace-nowrap">
										<MoaiAvatar traits={agent.persona.moai} size={18} />
										<span class="text-moai-muted">{agent.persona.name}</span>
									</span>
								{/if}
							</td>
							<td class="px-2 py-2.5">
								{#if m.buildStatus === 'success'}
									<CheckCircle2 size={14} class="text-ok" />
								{:else}
									<XCircle size={14} class="text-danger" />
								{/if}
							</td>
							<td class="px-4 py-2.5 text-right whitespace-nowrap text-moai-dim">{timeAgo(m.mergedAt)}</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<div class="border-t border-moai-border px-4 py-3">
				<div class="mb-2 text-[10px] font-semibold tracking-wider text-moai-dim uppercase">일별 서밋 changelist (7일)</div>
				<div class="flex h-16 items-end gap-1.5">
					{#each data.kpis.changelistsPerDay as v, i (i)}
						<div class="flex flex-1 flex-col items-center gap-1">
							<div
								class="w-full rounded-t bg-moai-gold/70 transition-all hover:bg-moai-gold"
								style={`height: ${(v / Math.max(...data.kpis.changelistsPerDay)) * 48}px`}
								title={`${v}건`}
							></div>
							<span class="text-[9px] text-moai-dim">{v}</span>
						</div>
					{/each}
				</div>
			</div>
		</section>
	</div>
</div>
