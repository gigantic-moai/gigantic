<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import type { Agent } from '@gigantic/shared';
	import { KNOWLEDGE_CATEGORY_META, ONBOARDING_STEPS, type KnowledgeCategory } from '@gigantic/shared';
	import { toast } from '$lib/stores/toast';
	import { Check, Loader2, CircleDashed, GraduationCap } from '@lucide/svelte';

	let { agent }: { agent: Agent } = $props();

	/** 온보딩 분석 깊이 (환경설정) — 0이면 전체 히스토리 */
	const depthMonths = $derived(Number(page.data.settings?.workflow?.onboardingMonths ?? 0));
	const depthLabel = $derived(depthMonths === 0 ? '전체 히스토리' : `최근 ${depthMonths}개월`);

	let busy = $state(false);

	const stepState = (idx: number): 'done' | 'active' | 'todo' => {
		// step = 현재 진행 중인 단계(1-based). 그보다 앞 단계는 완료.
		const current = agent.onboarding.step;
		if (agent.onboarding.step >= 7 || idx + 1 < current) return 'done';
		if (idx + 1 === current) return agent.status === 'awaiting-approval' && idx === 5 ? 'active' : 'active';
		return 'todo';
	};

	async function act(action: 'approve-onboarding' | 'reject-onboarding') {
		busy = true;
		try {
			const res = await fetch(`/api/agents/${agent.id}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ action })
			});
			if (res.ok) {
				toast(
					action === 'approve-onboarding'
						? `${agent.persona.name}의 지식이 승인되었습니다 — 🗿 모아이 완성, 스폰 가능 상태`
						: '지식 요약을 반려했습니다 — 학습을 다시 실행합니다',
					action === 'approve-onboarding' ? 'ok' : 'warn'
				);
			}
			await invalidateAll();
		} finally {
			busy = false;
		}
	}

	const summaryCats = Object.keys(KNOWLEDGE_CATEGORY_META) as KnowledgeCategory[];
</script>

<div class="panel p-5">
	<div class="flex items-center gap-2">
		<GraduationCap size={15} class="text-moai-gold" />
		<h3 class="text-sm font-bold">에이전트 온보딩 — 돌 깎기 & 지식 학습</h3>
	</div>
	<p class="mt-1 text-[11px] text-moai-dim">
		돌을 깎아 모아이를 만들고, 프로젝트에 축적된 지식을 학습합니다. 완료 전까지 작업을 시작하지 않습니다.
	</p>

	<ol class="mt-4 flex flex-col gap-2.5">
		{#each ONBOARDING_STEPS as step, i (i)}
			{@const s = stepState(i)}
			<li class="flex items-center gap-2.5 text-xs">
				{#if s === 'done'}
					<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok/15 text-ok">
						<Check size={12} />
					</span>
					<span class="text-moai-muted">{i + 1}. {step}</span>
				{:else if s === 'active'}
					<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moai-gold-faint text-moai-gold">
						<Loader2 size={12} class="animate-spin" />
					</span>
					<span class="font-semibold text-moai-gold">{i + 1}. {step}</span>
				{:else}
					<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-moai-dim">
						<CircleDashed size={12} />
					</span>
					<span class="text-moai-dim">{i + 1}. {step}</span>
				{/if}
			</li>
		{/each}
	</ol>

	{#if agent.onboarding.changesetsAnalyzed}
		<div class="mt-3 text-[11px] text-moai-muted">
			정독한 changeset: <span class="font-mono font-semibold text-moai-text">{agent.onboarding.changesetsAnalyzed.toLocaleString()}</span>개
			<span class="ml-2 text-moai-dim">· 분석 깊이: {depthLabel}</span>
		</div>
	{/if}

	{#if agent.status === 'awaiting-approval' && agent.onboarding.summary}
		<div class="mt-4 rounded-lg border border-warn/30 bg-warn/5 p-4">
			<div class="text-xs font-bold text-warn">지식 요약 — 사람 승인 대기</div>
			<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
				{#each summaryCats as cat (cat)}
					<div class="rounded-md border border-moai-border bg-moai-surface px-3 py-2 text-center">
						<div class="text-base font-bold text-moai-text">
							{agent.onboarding.summary[cat] ?? 0}
						</div>
						<div class="mt-0.5 text-[10px] text-moai-dim">
							{KNOWLEDGE_CATEGORY_META[cat].emoji} {KNOWLEDGE_CATEGORY_META[cat].label}
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-3.5 flex gap-2">
				<button class="btn-gold px-4 py-2 text-xs" disabled={busy} onclick={() => act('approve-onboarding')}>
					승인 → 🗿 모아이 완성
				</button>
				<button class="btn-ghost px-4 py-2 text-xs" disabled={busy} onclick={() => act('reject-onboarding')}>
					반려 — 다시 학습
				</button>
			</div>
		</div>
	{/if}
</div>
