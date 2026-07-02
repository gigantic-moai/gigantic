<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { DiffLine } from '@gigantic/shared';
	import { CONTRACT_BOUNDARY_META } from '@gigantic/shared';
	import CommentThread from '$lib/components/CommentThread.svelte';
	import DiffViewer from '$lib/components/DiffViewer.svelte';
	import MoaiAvatar from '$lib/components/MoaiAvatar.svelte';
	import { toast } from '$lib/stores/toast';
	import { timeAgo } from '$lib/utils';
	import {
		ArrowLeft,
		CheckCircle2,
		FilePenLine,
		GitMerge,
		Loader2,
		ScrollText,
		ShieldAlert,
		Sun,
		ThumbsDown,
		ThumbsUp,
		XCircle
	} from '@lucide/svelte';

	let { data } = $props();

	const cl = $derived(data.changelist);
	const agent = $derived(data.agents.find((a) => a.id === cl.agentId));
	const blocked = $derived(cl.contractViolations.some((v) => v.severity === 'block'));
	const decided = $derived(['approved', 'merged', 'rejected'].includes(cl.status));

	let logOpen = $state(false);
	let clComment = $state('');
	let busy = $state(false);

	const clLevelRoots = $derived(
		data.comments
			.filter((c) => !c.parentId && !c.filePath)
			.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
	);
	const fileComments = (path: string) => data.comments.filter((c) => c.filePath === path);

	async function decide(decision: 'approve' | 'reject' | 'request-changes') {
		busy = true;
		try {
			const res = await fetch(`/api/reviews/${cl.id}/decision`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ decision })
			});
			const body = await res.json();
			if (!res.ok) {
				toast(body.reason ?? '처리할 수 없습니다', 'danger');
			} else {
				toast(
					decision === 'approve'
						? `CL ${cl.number} 승인 — 머지를 시작합니다`
						: decision === 'reject'
							? `CL ${cl.number} 반려 — ${agent?.persona.name ?? '에이전트'}가 재시도합니다`
							: `CL ${cl.number} 수정 요청 — 부분 수정을 지시했습니다`,
					decision === 'approve' ? 'ok' : 'warn'
				);
			}
			await invalidateAll();
		} finally {
			busy = false;
		}
	}

	async function addComment(input: {
		filePath?: string;
		line?: number;
		lineType?: DiffLine['type'];
		body: string;
		parentId?: string;
	}) {
		await fetch(`/api/reviews/${cl.id}/comments`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ ...input, authorName: 'PO' })
		});
		await invalidateAll();
	}

	async function submitClComment() {
		const body = clComment.trim();
		if (!body) return;
		clComment = '';
		await addComment({ body });
	}
</script>

<svelte:head><title>CL {cl.number} · 리뷰창 · Gigantic 🗿</title></svelte:head>

<div class="mx-auto max-w-5xl">
	<a href="/review" class="mb-4 inline-flex items-center gap-1.5 text-xs text-moai-muted hover:text-moai-gold">
		<ArrowLeft size={13} /> 리뷰 목록
	</a>

	<!-- 헤더 -->
	<header class="panel p-5">
		<div class="flex flex-wrap items-start gap-3">
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-center gap-2">
					<span class="font-mono text-sm font-black text-moai-gold">CL {cl.number}</span>
					{#if cl.trunkFix}
						<span class="chip !border-day/40 !text-day"><Sun size={10} /> 트렁크 수정</span>
					{/if}
					{#if cl.status === 'merged'}
						<span class="chip !border-ok/40 !text-ok"><GitMerge size={10} /> 머지됨</span>
					{:else if cl.status === 'approved'}
						<span class="chip !border-info/40 !text-info"><Loader2 size={10} class="animate-spin" /> 머지 중</span>
					{:else if cl.status === 'rejected'}
						<span class="chip !border-danger/40 !text-danger">반려됨</span>
					{:else if cl.status === 'changes-requested'}
						<span class="chip !border-warn/40 !text-warn"><FilePenLine size={10} /> 수정 요청됨</span>
					{:else if blocked}
						<span class="chip !border-danger/40 !text-danger"><ShieldAlert size={10} /> 머지 차단</span>
					{/if}
					<span class="chip">
						{#if cl.buildStatus === 'success'}
							<CheckCircle2 size={10} class="text-ok" /> 젠킨스 빌드 성공
						{:else if cl.buildStatus === 'failed'}
							<XCircle size={10} class="text-danger" /> 젠킨스 빌드 실패
						{:else}
							<Loader2 size={10} class="animate-spin" /> 빌드 진행 중
						{/if}
					</span>
				</div>
				<h1 class="mt-2 text-base font-bold">{cl.title}</h1>
				<div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-moai-dim">
					{#if agent}
						<a href={`/agents/${agent.id}`} class="flex items-center gap-1.5 hover:text-moai-gold">
							<MoaiAvatar traits={agent.persona.moai} size={18} />
							{agent.persona.name} · {agent.persona.role}
						</a>
					{/if}
					{#if data.issue}
						<a href="/kanban" class="font-mono hover:text-moai-gold">{data.issue.key}</a>
					{/if}
					<span>{timeAgo(cl.createdAt)}</span>
				</div>
			</div>

			<!-- 승인/반려/수정 요청 -->
			{#if !decided}
				<div class="flex shrink-0 flex-wrap gap-2">
					<button
						class="btn-gold flex items-center gap-1.5 px-4 py-2 text-xs"
						disabled={busy || blocked}
						title={blocked ? '계약 위반이 해결될 때까지 머지가 차단됩니다' : '승인 시 메인에 머지'}
						onclick={() => decide('approve')}
					>
						<ThumbsUp size={13} /> 승인 → 머지
					</button>
					<button
						class="btn-ghost flex items-center gap-1.5 px-3.5 py-2 text-xs hover:!border-warn hover:!text-warn"
						disabled={busy}
						onclick={() => decide('request-changes')}
					>
						<FilePenLine size={13} /> 수정 요청
					</button>
					<button
						class="btn-ghost flex items-center gap-1.5 px-3.5 py-2 text-xs hover:!border-danger hover:!text-danger"
						disabled={busy}
						onclick={() => decide('reject')}
					>
						<ThumbsDown size={13} /> 반려
					</button>
				</div>
			{/if}
		</div>

		<!-- 계약 위반 -->
		{#each cl.contractViolations as v (v.contractId)}
			<div class="mt-4 rounded-lg border border-danger/35 bg-danger/8 p-3.5">
				<div class="flex items-center gap-2 text-xs font-bold text-danger">
					<ShieldAlert size={14} />
					계약 위반 — {v.severity === 'block' ? '머지 차단' : '경고'}
					<span class="chip !border-danger/30">{CONTRACT_BOUNDARY_META[v.boundary].label}</span>
					<a href="/wiki#contracts" class="ml-auto text-[10px] font-normal text-moai-muted hover:text-moai-gold">계약 레지스트리 →</a>
				</div>
				<p class="mt-2 text-xs leading-relaxed text-moai-text">{v.message}</p>
				<p class="mt-1.5 text-[11px] text-moai-muted">💡 {v.suggestion}</p>
			</div>
		{/each}

		<!-- CL description + 에이전트 로그 -->
		<div class="mt-4 rounded-lg border border-moai-border bg-moai-surface p-3.5">
			<div class="text-[10px] font-bold tracking-wider text-moai-dim uppercase">P4 changelist description</div>
			<p class="diff-code mt-2 !text-[11px] whitespace-pre-wrap text-moai-muted">{cl.description}</p>
			<button
				class="mt-3 flex items-center gap-1.5 text-[11px] text-moai-muted hover:text-moai-gold"
				onclick={() => (logOpen = !logOpen)}
			>
				<ScrollText size={12} />
				에이전트 작업 로그 (자동 부착) {logOpen ? '접기' : `펼치기 · ${cl.agentLog.length}줄`}
			</button>
			{#if logOpen}
				<ol class="mt-2 flex flex-col gap-1 border-l-2 border-moai-border pl-3">
					{#each cl.agentLog as line, i (i)}
						<li class="font-mono text-[10.5px] text-moai-muted">{line}</li>
					{/each}
				</ol>
			{/if}
		</div>
	</header>

	<!-- 파일 diff -->
	<div class="mt-5 flex flex-col gap-4">
		{#each cl.files as file (file.path)}
			<DiffViewer {file} comments={fileComments(file.path)} agents={data.agents} onComment={(input) => addComment({ ...input, filePath: file.path })} />
		{/each}
	</div>

	<!-- CL 전체 코멘트 -->
	<section class="mt-6 mb-10">
		<h2 class="mb-2.5 text-xs font-bold">대화 — 사람 ↔ {agent?.persona.name ?? '에이전트'}</h2>
		{#if clLevelRoots.length > 0}
			<CommentThread roots={clLevelRoots} all={data.comments} agents={data.agents} onReply={(parentId, body) => addComment({ body, parentId })} />
		{:else}
			<p class="mb-3 text-[11px] text-moai-dim">아직 코멘트가 없습니다. diff의 라인을 클릭하면 라인 단위 코멘트도 달 수 있습니다.</p>
		{/if}
		<div class="mt-3 flex gap-2">
			<input
				class="min-w-0 flex-1 rounded-lg border border-moai-border-strong bg-moai-panel px-3.5 py-2.5 text-xs outline-none focus:border-moai-gold"
				placeholder="CL 전체에 코멘트 — 에이전트가 변경 근거로 답합니다"
				bind:value={clComment}
				onkeydown={(e) => {
					if (e.key === 'Enter' && !e.isComposing) submitClComment();
				}}
			/>
			<button class="btn-gold px-4 py-2.5 text-xs" onclick={submitClComment}>코멘트</button>
		</div>
	</section>
</div>
