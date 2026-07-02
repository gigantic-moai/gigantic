<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { KnowledgeCategory, KnowledgeEntry } from '@gigantic/shared';
	import { CONTRACT_BOUNDARY_META, KNOWLEDGE_CATEGORY_META } from '@gigantic/shared';
	import MoaiAvatar from '$lib/components/MoaiAvatar.svelte';
	import { toast } from '$lib/stores/toast';
	import { timeAgo } from '$lib/utils';
	import { Check, ExternalLink, Pencil, Plus, ShieldAlert, X } from '@lucide/svelte';

	let { data } = $props();

	const CATS = Object.keys(KNOWLEDGE_CATEGORY_META) as KnowledgeCategory[];

	let catFilter = $state<KnowledgeCategory | 'all'>('all');
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editBody = $state('');
	let adding = $state(false);
	let newCat = $state<KnowledgeCategory>('pattern');
	let newTitle = $state('');
	let newBody = $state('');

	const agentOf = (id?: string) => data.agents.find((a) => a.id === id);

	const pending = $derived(data.knowledge.filter((k) => k.status === 'pending'));
	const approved = $derived(
		data.knowledge
			.filter((k) => k.status === 'approved' && (catFilter === 'all' || k.category === catFilter))
			.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
	);

	async function api(payload: Record<string, unknown>) {
		await fetch('/api/knowledge', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		await invalidateAll();
	}

	function startEdit(k: KnowledgeEntry) {
		editingId = k.id;
		editTitle = k.title;
		editBody = k.body;
	}

	async function saveEdit() {
		if (!editingId) return;
		await api({ action: 'update', id: editingId, title: editTitle, body: editBody });
		editingId = null;
		toast('지식을 수정했습니다', 'ok');
	}

	async function addEntry() {
		if (!newTitle.trim() || !newBody.trim()) {
			toast('제목과 내용을 입력하세요', 'warn');
			return;
		}
		await api({ action: 'add', category: newCat, title: newTitle.trim(), body: newBody.trim() });
		adding = false;
		newTitle = '';
		newBody = '';
		toast('지식이 등록되었습니다 (사람 작성 — 즉시 정식 지식)', 'ok');
	}
</script>

<svelte:head><title>지식 위키 · Gigantic 🗿</title></svelte:head>

{#snippet entryCard(k: KnowledgeEntry)}
	{@const meta = KNOWLEDGE_CATEGORY_META[k.category]}
	{@const agent = agentOf(k.sourceAgentId)}
	<article class="panel p-4">
		<div class="flex flex-wrap items-center gap-2">
			<span class="chip">{meta.emoji} {meta.label}</span>
			{#each k.tags as t (t)}<span class="chip">{t}</span>{/each}
			<span class="ml-auto text-[10px] text-moai-dim">{timeAgo(k.updatedAt)}</span>
		</div>
		{#if editingId === k.id}
			<input
				class="mt-3 w-full rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 text-sm font-bold outline-none focus:border-moai-gold"
				bind:value={editTitle}
			/>
			<textarea
				rows="5"
				class="mt-2 w-full resize-y rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 text-xs leading-relaxed outline-none focus:border-moai-gold"
				bind:value={editBody}
			></textarea>
			<div class="mt-2 flex gap-2">
				<button class="btn-gold px-3 py-1.5 text-xs" onclick={saveEdit}>저장</button>
				<button class="btn-ghost px-3 py-1.5 text-xs" onclick={() => (editingId = null)}>취소</button>
			</div>
		{:else}
			<h3 class="mt-2.5 text-sm font-bold">{k.title}</h3>
			<p class="mt-1.5 text-xs leading-relaxed whitespace-pre-wrap text-moai-muted">{k.body}</p>
			<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-moai-dim">
				{#if agent}
					<span class="flex items-center gap-1.5">
						<MoaiAvatar traits={agent.persona.moai} size={16} />
						{agent.persona.name} 발견
					</span>
				{:else}
					<span>온보딩 자동 구축 / 사람 작성</span>
				{/if}
				{#if k.sourceChangelist}<span class="font-mono">근거: CL {k.sourceChangelist}</span>{/if}
				<span class="ml-auto">출처: {meta.source}</span>
				{#if k.status === 'approved'}
					<button class="flex items-center gap-1 text-moai-muted hover:text-moai-gold" onclick={() => startEdit(k)}>
						<Pencil size={11} /> 편집
					</button>
				{/if}
			</div>
			{#if k.status === 'pending'}
				<div class="mt-3 flex gap-2">
					<button
						class="btn-gold flex items-center gap-1 px-3 py-1.5 text-xs"
						onclick={() => api({ action: 'approve', id: k.id }).then(() => toast('정식 지식으로 승인했습니다 — 섬이 성장합니다 🏝️', 'ok'))}
					>
						<Check size={12} /> 승인
					</button>
					<button
						class="btn-ghost flex items-center gap-1 px-3 py-1.5 text-xs hover:!border-danger hover:!text-danger"
						onclick={() => api({ action: 'reject', id: k.id }).then(() => toast('반려했습니다 — 패턴으로 승격하지 않습니다', 'warn'))}
					>
						<X size={12} /> 반려
					</button>
				</div>
			{/if}
		{/if}
	</article>
{/snippet}

<div class="mx-auto max-w-5xl">
	<header class="mb-6 flex flex-wrap items-center gap-3">
		<div>
			<h1 class="text-lg font-black">📚 지식 위키</h1>
			<p class="mt-1 text-xs text-moai-dim">
				에이전트가 발견하고, 사람이 승인해야 정식 지식이 됩니다. 에이전트가 마음대로 학습하지 않습니다.
			</p>
		</div>
		<button class="btn-gold ml-auto flex items-center gap-1.5 px-3.5 py-2 text-xs" onclick={() => (adding = !adding)}>
			<Plus size={13} /> 지식 직접 등록
		</button>
	</header>

	{#if adding}
		<div class="panel mb-5 p-4">
			<div class="flex flex-wrap gap-2">
				<select bind:value={newCat} class="rounded-md border border-moai-border-strong bg-moai-bg px-2.5 py-2 text-xs outline-none focus:border-moai-gold">
					{#each CATS as c (c)}
						<option value={c}>{KNOWLEDGE_CATEGORY_META[c].emoji} {KNOWLEDGE_CATEGORY_META[c].label}</option>
					{/each}
				</select>
				<input
					class="min-w-0 flex-1 rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 text-xs outline-none focus:border-moai-gold"
					placeholder="제목 — 예: 대미지 계산은 항상 GameplayEffectExecutionCalculation을 통한다"
					bind:value={newTitle}
				/>
			</div>
			<textarea
				rows="3"
				class="mt-2 w-full resize-y rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 text-xs leading-relaxed outline-none focus:border-moai-gold"
				placeholder="구체적인 패턴/매핑/계약/이력 — 추상적 철학은 학습하지 않습니다"
				bind:value={newBody}
			></textarea>
			<div class="mt-2 flex gap-2">
				<button class="btn-gold px-3.5 py-2 text-xs" onclick={addEntry}>등록</button>
				<button class="btn-ghost px-3.5 py-2 text-xs" onclick={() => (adding = false)}>취소</button>
			</div>
		</div>
	{/if}

	<!-- 계약 위반 경고 -->
	{#if data.violations.length > 0}
		<section class="mb-6">
			<h2 class="mb-2 text-xs font-bold text-danger">⚠ 계약 위반 경고</h2>
			<div class="flex flex-col gap-2">
				{#each data.violations as v (v.contractId + v.changelistId)}
					<a
						href={`/review/${v.changelistId}`}
						class="flex items-start gap-3 rounded-xl border border-danger/35 bg-danger/8 px-4 py-3 transition-colors hover:bg-danger/15"
					>
						<ShieldAlert size={15} class="mt-0.5 shrink-0 text-danger" />
						<div class="text-xs">
							<span class="font-bold text-danger">{v.contractName}</span>
							<span class="chip !ml-1.5">{CONTRACT_BOUNDARY_META[v.boundary].label}</span>
							<span class="ml-1.5 font-mono text-moai-gold">CL {v.changelistNumber}</span>
							<p class="mt-1 leading-relaxed text-moai-muted">{v.message}</p>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- 승인 대기 -->
	{#if pending.length > 0}
		<section class="mb-6">
			<h2 class="mb-2 text-xs font-bold text-warn">승인 대기 — {pending.length}건</h2>
			<div class="flex flex-col gap-3">
				{#each pending as k (k.id)}
					{@render entryCard(k)}
				{/each}
			</div>
		</section>
	{/if}

	<!-- 정식 지식 -->
	<section class="mb-8">
		<div class="mb-2.5 flex flex-wrap items-center gap-1.5">
			<h2 class="mr-2 text-xs font-bold">정식 지식</h2>
			<button
				class="chip {catFilter === 'all' ? '!border-moai-gold !text-moai-gold' : 'hover:bg-moai-hover'}"
				onclick={() => (catFilter = 'all')}
			>
				전체
			</button>
			{#each CATS as c (c)}
				<button
					class="chip {catFilter === c ? '!border-moai-gold !text-moai-gold' : 'hover:bg-moai-hover'}"
					onclick={() => (catFilter = c)}
				>
					{KNOWLEDGE_CATEGORY_META[c].emoji} {KNOWLEDGE_CATEGORY_META[c].label}
				</button>
			{/each}
		</div>
		<div class="flex flex-col gap-3">
			{#each approved as k (k.id)}
				{@render entryCard(k)}
			{:else}
				<p class="py-6 text-center text-[11px] text-moai-dim">해당 범주의 지식이 없습니다</p>
			{/each}
		</div>
	</section>

	<!-- 계약 레지스트리 -->
	<section id="contracts" class="mb-10">
		<h2 class="mb-1 text-xs font-bold">📜 계약 레지스트리</h2>
		<p class="mb-3 text-[11px] text-moai-dim">
			온보딩 때 자동 식별된 시스템 경계 계약. 등록된 시그니처를 변경하면 반대편 코드 경고, 외부 서비스면 머지가 차단됩니다.
		</p>
		<div class="panel divide-y divide-moai-border overflow-hidden">
			{#each data.contracts as c (c.id)}
				<div class="px-4 py-3.5">
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-xs font-bold">{c.name}</span>
						<span class="chip">{CONTRACT_BOUNDARY_META[c.boundary].label}</span>
						{#if c.external}
							<span class="chip !border-danger/40 !text-danger">외부 — 위반 시 머지 차단</span>
						{/if}
						{#if data.violations.some((v) => v.contractId === c.id)}
							<span class="chip !border-danger/40 !text-danger"><ShieldAlert size={9} /> 위반 발생 중</span>
						{/if}
					</div>
					<pre class="diff-code mt-2 overflow-x-auto rounded-md bg-moai-bg px-3 py-2 !text-[10.5px] text-moai-muted">{c.signature}</pre>
					<div class="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-moai-dim">
						<span class="font-mono">{c.file}</span>
						<span class="flex items-center gap-1">
							<ExternalLink size={9} /> 반대편: {c.counterparts.join(' · ')}
						</span>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
