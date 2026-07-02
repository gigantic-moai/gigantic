<script lang="ts">
	import MoaiAvatar from '$lib/components/MoaiAvatar.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import SpawnWizard from '$lib/components/SpawnWizard.svelte';
	import { liveAgents } from '$lib/stores/realtime';
	import { Moon, Sun, GraduationCap } from '@lucide/svelte';

	let { data } = $props();

	let wizardOpen = $state(false);

	const live = (id: string) => $liveAgents.get(id);
	const issueOf = (id?: string) => data.issues.find((i) => i.id === id);
</script>

<svelte:head><title>에이전트 관리 · Gigantic 🗿</title></svelte:head>

<div class="mx-auto max-w-6xl">
	<header class="mb-6 flex flex-wrap items-center gap-3">
		<div>
			<h1 class="text-lg font-black">⚡ 에이전트 관리</h1>
			<p class="mt-1 text-xs text-moai-dim">
				스폰은 한 번 — 이후는 스케줄에 따라 자율 운영됩니다. 사람은 스크럼을 읽고 리뷰만.
			</p>
		</div>
		<button class="btn-gold ml-auto px-4 py-2.5 text-xs" onclick={() => (wizardOpen = true)}>
			🗿 Spawn — 새 에이전트
		</button>
	</header>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each data.agents as agent (agent.id)}
			{@const l = live(agent.id)}
			{@const status = (l?.status as typeof agent.status) ?? agent.status}
			{@const progress = l?.progress ?? agent.progress}
			{@const issue = issueOf(agent.currentIssueId)}
			<a href={`/agents/${agent.id}`} class="panel group flex flex-col p-5 transition-colors hover:border-moai-border-strong">
				<div class="flex items-start gap-3.5">
					<MoaiAvatar traits={agent.persona.moai} size={64} title={agent.persona.name} />
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<h2 class="text-sm font-black group-hover:text-moai-gold">{agent.persona.name}</h2>
						</div>
						<div class="mt-0.5 text-[11px] text-moai-muted">{agent.persona.role}</div>
						<div class="mt-2"><StatusBadge {status} size="sm" /></div>
					</div>
				</div>

				<p class="mt-3 line-clamp-2 min-h-8 text-[11px] leading-relaxed text-moai-dim">
					{agent.persona.personality}
				</p>

				<div class="mt-2.5 flex flex-wrap gap-1">
					{#each agent.persona.tags as t (t)}<span class="chip">{t}</span>{/each}
				</div>

				<!-- 현재 작업 -->
				<div class="mt-4 rounded-lg border border-moai-border bg-moai-surface px-3 py-2.5">
					{#if status === 'onboarding'}
						<div class="flex items-center gap-2 text-[11px] text-info">
							<GraduationCap size={13} />
							온보딩 {agent.onboarding.step}/7 — {l?.activity ?? agent.activity}
						</div>
						<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-moai-raised">
							<div class="h-full rounded-full bg-info transition-all" style={`width:${(agent.onboarding.step / 7) * 100}%`}></div>
						</div>
					{:else if status === 'awaiting-approval'}
						<div class="text-[11px] font-semibold text-warn">지식 요약 승인 대기 — 카드를 눌러 검토하세요</div>
					{:else}
						<div class="truncate text-[11px] text-moai-muted">{l?.activity ?? agent.activity ?? '대기 중'}</div>
						{#if status === 'night-work' && progress !== undefined}
							<div class="mt-2 flex items-center gap-2">
								<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-moai-raised">
									<div class="h-full rounded-full bg-night transition-all" style={`width:${progress}%`}></div>
								</div>
								<span class="font-mono text-[10px] text-night">{progress}%</span>
							</div>
							{#if issue}
								<div class="mt-1.5 font-mono text-[10px] text-moai-dim">{issue.key} · {issue.title}</div>
							{/if}
						{/if}
					{/if}
				</div>

				<!-- 스케줄/통계 요약 -->
				<div class="mt-3 flex items-center gap-3 text-[10px] text-moai-dim">
					<span class="flex items-center gap-1"><Moon size={10} class="text-night" /> {agent.schedule.nightStart}–{agent.schedule.nightEnd}</span>
					{#if agent.schedule.dayWatchEnabled}
						<span class="flex items-center gap-1"><Sun size={10} class="text-day" /> {agent.schedule.trunkWatchMinutes}분 주기</span>
					{/if}
					<span class="ml-auto">완료 {agent.stats.issuesDone} · CL {agent.stats.changelists}</span>
				</div>
			</a>
		{/each}
	</div>
</div>

{#if wizardOpen}
	<SpawnWizard onclose={() => (wizardOpen = false)} />
{/if}
