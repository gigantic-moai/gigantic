<script lang="ts">
	import type { Issue } from '@gigantic/shared';
	import DependencyGraph from '$lib/components/DependencyGraph.svelte';
	import MoaiAvatar from '$lib/components/MoaiAvatar.svelte';
	import { ArrowDown, Lock } from '@lucide/svelte';

	let { data } = $props();

	const agentOf = (id?: string) => data.agents.find((a) => a.id === id);

	/** 의존성 그래프 기반 spawn 순서 자동 결정 — 위상 정렬 (§5.2) */
	const spawnOrder = $derived.by(() => {
		const open = data.issues.filter((i) => i.status !== 'done');
		const openIds = new Set(open.map((i) => i.id));
		const doneIds = new Set(data.issues.filter((i) => i.status === 'done').map((i) => i.id));
		const order: { issue: Issue; wave: number; blockedBy: string[]; conflictWith?: Issue }[] = [];
		const waveOf = new Map<string, number>();

		const resolve = (i: Issue, seen: Set<string>): number => {
			if (waveOf.has(i.id)) return waveOf.get(i.id)!;
			if (seen.has(i.id)) return 0;
			seen.add(i.id);
			const activeDeps = i.deps.filter((d) => openIds.has(d));
			const wave =
				activeDeps.length === 0
					? 0
					: 1 + Math.max(...activeDeps.map((d) => resolve(open.find((x) => x.id === d)!, seen)));
			waveOf.set(i.id, wave);
			return wave;
		};

		for (const i of open) resolve(i, new Set());

		// PA-03: 같은 .uasset을 건드리는 이슈는 같은 웨이브에 두지 않는다 (직렬화)
		const claimed = new Map<string, string>(); // uasset → issueId (wave별 재계산)
		const byWave = [...open].sort(
			(a, b) => (waveOf.get(a.id) ?? 0) - (waveOf.get(b.id) ?? 0) || a.priority.localeCompare(b.priority)
		);
		for (const i of byWave) {
			let wave = waveOf.get(i.id) ?? 0;
			let conflictWith: Issue | undefined;
			for (const u of i.uassets) {
				const holder = claimed.get(`${wave}:${u}`);
				while (claimed.get(`${wave}:${u}`)) wave += 1;
				if (holder) conflictWith = open.find((x) => x.id === holder);
			}
			for (const u of i.uassets) claimed.set(`${wave}:${u}`, i.id);
			waveOf.set(i.id, wave);
			order.push({
				issue: i,
				wave,
				blockedBy: i.deps
					.filter((d) => openIds.has(d) || doneIds.has(d))
					.map((d) => data.issues.find((x) => x.id === d)?.key ?? d),
				conflictWith
			});
		}
		return order.sort((a, b) => a.wave - b.wave || a.issue.priority.localeCompare(b.issue.priority));
	});

	const waves = $derived([...new Set(spawnOrder.map((o) => o.wave))].sort((a, b) => a - b));
</script>

<svelte:head><title>워터폴 보드 · Gigantic 🗿</title></svelte:head>

<div class="mx-auto max-w-7xl">
	<header class="mb-5">
		<h1 class="text-lg font-black">🔽 워터폴 보드</h1>
		<p class="mt-1 text-xs text-moai-dim">
			이슈 간 의존성 그래프. 그래프가 오늘 밤 에이전트 spawn 순서를 자동으로 결정합니다.
		</p>
	</header>

	<div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
		<section class="panel min-w-0 p-4">
			<div class="mb-3 flex flex-wrap items-center gap-3 text-[10px] text-moai-dim">
				<span class="flex items-center gap-1.5"><span class="inline-block h-2.5 w-4 rounded-sm border border-moai-gold"></span> 의존성 (선행 → 후행)</span>
				<span class="flex items-center gap-1.5"><span class="inline-block w-4 border-t-2 border-dashed border-danger"></span> .uasset 배타적 잠금 충돌 (직렬화)</span>
				<span class="flex items-center gap-1.5">🔒 바이너리 에셋 잠금 필요</span>
			</div>
			<DependencyGraph issues={data.issues} agents={data.agents} />
		</section>

		<!-- spawn 순서 -->
		<section class="panel h-fit">
			<div class="border-b border-moai-border px-4 py-3">
				<h2 class="text-xs font-bold">🌙 오늘 밤 spawn 순서</h2>
				<p class="mt-0.5 text-[10px] text-moai-dim">의존성 + .uasset 충돌 사전 분석 반영</p>
			</div>
			<div class="flex flex-col gap-1 p-3">
				{#each waves as wave (wave)}
					<div class="mt-1 mb-0.5 flex items-center gap-2 text-[10px] font-bold tracking-wider text-moai-dim uppercase">
						{#if wave > 0}<ArrowDown size={11} />{/if}
						웨이브 {wave + 1}
					</div>
					{#each spawnOrder.filter((o) => o.wave === wave) as o (o.issue.id)}
						{@const agent = agentOf(o.issue.assigneeId)}
						<div class="flex items-center gap-2.5 rounded-lg border border-moai-border bg-moai-surface px-3 py-2">
							<span class="font-mono text-[11px] font-bold text-moai-gold">{o.issue.key}</span>
							<span class="min-w-0 flex-1 truncate text-[11px]">{o.issue.title}</span>
							{#if agent}
								<MoaiAvatar traits={agent.persona.moai} size={18} title={agent.persona.name} />
							{/if}
						</div>
						{#if o.blockedBy.length > 0 || o.conflictWith}
							<div class="mb-1 ml-3 flex flex-wrap gap-x-3 text-[9.5px] text-moai-dim">
								{#if o.blockedBy.length > 0}
									<span>← {o.blockedBy.join(', ')} 이후</span>
								{/if}
								{#if o.conflictWith}
									<span class="flex items-center gap-1 text-danger">
										<Lock size={9} /> {o.conflictWith.key}와 .uasset 충돌 — 직렬화됨
									</span>
								{/if}
							</div>
						{/if}
					{/each}
				{/each}
				{#if spawnOrder.length === 0}
					<div class="px-3 py-6 text-center text-[11px] text-moai-dim">열린 이슈가 없습니다</div>
				{/if}
			</div>
		</section>
	</div>
</div>
