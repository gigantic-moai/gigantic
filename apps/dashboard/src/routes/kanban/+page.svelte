<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { Issue, IssueStatus } from '@gigantic/shared';
	import MoaiAvatar from '$lib/components/MoaiAvatar.svelte';
	import { toast } from '$lib/stores/toast';
	import { issueKeyNum, timeAgo } from '$lib/utils';
	import { Lock, ShieldAlert, Sun, ThumbsDown, ThumbsUp } from '@lucide/svelte';

	let { data } = $props();

	const COLUMNS: { key: IssueStatus; label: string; hint: string }[] = [
		{ key: 'todo', label: 'To Do', hint: '밤이 되면 에이전트가 가져갑니다' },
		{ key: 'in-progress', label: 'In Progress', hint: '🌙 에이전트 자율 작업 중' },
		{ key: 'review', label: 'Review', hint: '사람의 승인/반려 차례' },
		{ key: 'done', label: 'Done', hint: '메인에 머지 완료' }
	];

	let agentFilter = $state<string>('all');
	let dragging = $state<string | null>(null);
	let dragOver = $state<IssueStatus | null>(null);
	/** 낙관적 이동 반영 — 서버 응답 전 임시 상태 */
	let optimistic = $state<Record<string, IssueStatus>>({});

	const agentOf = (id?: string) => data.agents.find((a) => a.id === id);
	const clOf = (id?: string) => data.changelists.find((c) => c.id === id);

	const visible = $derived(
		data.issues.filter((i) => agentFilter === 'all' || i.assigneeId === agentFilter)
	);
	const inColumn = (col: IssueStatus) =>
		visible
			.filter((i) => (optimistic[i.id] ?? i.status) === col)
			.sort((a, b) => a.priority.localeCompare(b.priority) || issueKeyNum(a.key) - issueKeyNum(b.key));

	async function moveTo(issueId: string, status: IssueStatus) {
		optimistic = { ...optimistic, [issueId]: status };
		await fetch('/api/issues/move', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ issueId, status })
		});
		await invalidateAll();
		optimistic = {};
	}

	function onDrop(e: DragEvent, col: IssueStatus) {
		e.preventDefault();
		dragOver = null;
		const id = e.dataTransfer?.getData('text/plain') || dragging;
		dragging = null;
		if (id) moveTo(id, col);
	}

	async function decide(issue: Issue, decision: 'approve' | 'reject') {
		const cl = clOf(issue.changelistId);
		if (!cl) {
			toast('연결된 changelist가 없습니다', 'warn');
			return;
		}
		const res = await fetch(`/api/reviews/${cl.id}/decision`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ decision })
		});
		const body = await res.json();
		if (!res.ok) toast(body.reason ?? '처리할 수 없습니다', 'danger');
		else
			toast(
				decision === 'approve'
					? `CL ${cl.number} 승인 — 머지 큐에 들어갑니다`
					: `CL ${cl.number} 반려 — 에이전트가 재시도합니다`,
				decision === 'approve' ? 'ok' : 'warn'
			);
		await invalidateAll();
	}

	const priorityColor = (p: Issue['priority']) =>
		p === 'p0' ? 'var(--color-danger)' : p === 'p1' ? 'var(--color-warn)' : 'var(--color-moai-dim)';
</script>

<svelte:head><title>칸반보드 · Gigantic 🗿</title></svelte:head>

<div class="mx-auto max-w-7xl">
	<header class="mb-5 flex flex-wrap items-center gap-3">
		<div>
			<h1 class="text-lg font-black">📋 칸반보드</h1>
			<p class="mt-1 text-xs text-moai-dim">에이전트가 카드를 자동으로 옮깁니다. 사람은 Review에서 승인/반려만.</p>
		</div>
		<div class="ml-auto flex items-center gap-2">
			<label class="text-[11px] text-moai-dim" for="agent-filter">에이전트</label>
			<select
				id="agent-filter"
				bind:value={agentFilter}
				class="rounded-md border border-moai-border-strong bg-moai-panel px-2.5 py-1.5 text-xs outline-none focus:border-moai-gold"
			>
				<option value="all">전체</option>
				{#each data.agents as a (a.id)}
					<option value={a.id}>🗿 {a.persona.name}</option>
				{/each}
			</select>
		</div>
	</header>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
		{#each COLUMNS as col (col.key)}
			{@const cards = inColumn(col.key)}
			<section
				class="flex min-h-[60vh] flex-col rounded-xl border bg-moai-surface/60 transition-colors {dragOver === col.key
					? 'border-moai-gold'
					: 'border-moai-border'}"
				ondragover={(e) => {
					e.preventDefault();
					dragOver = col.key;
				}}
				ondragleave={() => (dragOver = dragOver === col.key ? null : dragOver)}
				ondrop={(e) => onDrop(e, col.key)}
				aria-label={`${col.label} 컬럼`}
			>
				<div class="flex items-center gap-2 px-3.5 pt-3.5 pb-2">
					<h2 class="text-xs font-bold tracking-wide">{col.label}</h2>
					<span class="rounded-full bg-moai-raised px-1.5 py-0.5 text-[10px] text-moai-muted">{cards.length}</span>
					<span class="ml-auto text-[9px] text-moai-dim">{col.hint}</span>
				</div>

				<div class="flex flex-1 flex-col gap-2 p-2.5 pt-1">
					{#each cards as issue (issue.id)}
						{@const agent = agentOf(issue.assigneeId)}
						{@const cl = clOf(issue.changelistId)}
						<article
							class="group cursor-grab rounded-lg border border-moai-border bg-moai-panel p-3 shadow-sm transition-colors select-none hover:border-moai-border-strong active:cursor-grabbing {dragging === issue.id ? 'opacity-40' : ''}"
							draggable="true"
							ondragstart={(e) => {
								dragging = issue.id;
								e.dataTransfer?.setData('text/plain', issue.id);
								if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
							}}
							ondragend={() => (dragging = null)}
						>
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full" style={`background:${priorityColor(issue.priority)}`} title={issue.priority.toUpperCase()}></span>
								<span class="font-mono text-[11px] font-bold text-moai-gold">{issue.key}</span>
								{#if issue.trunkFix}
									<span class="chip !border-day/40 !text-day"><Sun size={9} /> 트렁크 수정</span>
								{/if}
								{#if issue.uassets.length > 0}
									<span title={`배타적 잠금: ${issue.uassets.join(', ')}`}><Lock size={11} class="text-warn" /></span>
								{/if}
								<span class="ml-auto text-[9px] text-moai-dim">{timeAgo(issue.updatedAt)}</span>
							</div>
							<h3 class="mt-1.5 text-xs leading-snug font-semibold">{issue.title}</h3>
							<div class="mt-2 flex flex-wrap gap-1">
								{#each issue.tags as t (t)}
									<span class="chip">{t}</span>
								{/each}
							</div>
							<div class="mt-2.5 flex items-center gap-1.5">
								{#if agent}
									<MoaiAvatar traits={agent.persona.moai} size={20} title={agent.persona.name} />
									<span class="text-[11px] text-moai-muted">{agent.persona.name}</span>
								{:else}
									<span class="text-[11px] text-moai-dim">미할당 — 태그 매칭 대기</span>
								{/if}
								{#if cl}
									<a href={`/review/${cl.id}`} class="ml-auto font-mono text-[10px] text-moai-gold hover:underline">
										CL {cl.number}
									</a>
								{/if}
							</div>

							{#if col.key === 'review' && cl}
								{#if cl.violations > 0}
									<div class="mt-2.5 flex items-center gap-1.5 rounded-md border border-danger/30 bg-danger/8 px-2 py-1.5 text-[10px] text-danger">
										<ShieldAlert size={11} /> 계약 위반 — 머지 차단, 리뷰창에서 확인
									</div>
								{:else}
									<div class="mt-2.5 flex gap-1.5">
										<button
											class="btn-gold flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px]"
											onclick={() => decide(issue, 'approve')}
										>
											<ThumbsUp size={11} /> 승인
										</button>
										<button
											class="btn-ghost flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px] hover:!border-danger hover:!text-danger"
											onclick={() => decide(issue, 'reject')}
										>
											<ThumbsDown size={11} /> 반려
										</button>
									</div>
								{/if}
							{/if}
						</article>
					{/each}
					{#if cards.length === 0}
						<div class="flex flex-1 items-center justify-center rounded-lg border border-dashed border-moai-border py-8 text-[11px] text-moai-dim">
							비어 있음
						</div>
					{/if}
				</div>
			</section>
		{/each}
	</div>
</div>
