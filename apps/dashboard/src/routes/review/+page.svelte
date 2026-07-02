<script lang="ts">
	import type { Changelist } from '@gigantic/shared';
	import MoaiAvatar from '$lib/components/MoaiAvatar.svelte';
	import { timeAgo } from '$lib/utils';
	import {
		CheckCircle2,
		FileCode2,
		GitMerge,
		MessageSquare,
		ShieldAlert,
		Sun,
		XCircle,
		Loader2
	} from '@lucide/svelte';

	let { data } = $props();

	const agentOf = (id: string) => data.agents.find((a) => a.id === id);
	const issueOf = (id?: string) => data.issues.find((i) => i.id === id);

	const GROUPS: { label: string; statuses: Changelist['status'][]; hint?: string }[] = [
		{ label: '리뷰 대기', statuses: ['open'], hint: '아침의 당신을 기다리는 목록' },
		{ label: '머지 차단 — 계약 위반', statuses: ['blocked'], hint: '사람이 발견하기 전에 기계가 잡았습니다' },
		{ label: '수정 요청됨', statuses: ['changes-requested'] },
		{ label: '승인 · 머지됨', statuses: ['approved', 'merged'] },
		{ label: '반려됨', statuses: ['rejected'] }
	];

	const statusMeta = (s: Changelist['status']) =>
		(
			({
				open: { label: '리뷰 대기', class: 'text-moai-gold' },
				approved: { label: '머지 중', class: 'text-info' },
				merged: { label: '머지됨', class: 'text-ok' },
				rejected: { label: '반려', class: 'text-danger' },
				'changes-requested': { label: '수정 요청', class: 'text-warn' },
				blocked: { label: '머지 차단', class: 'text-danger' }
			}) as Record<string, { label: string; class: string }>
		)[s];
</script>

<svelte:head><title>리뷰창 · Gigantic 🗿</title></svelte:head>

<div class="mx-auto max-w-5xl">
	<header class="mb-6">
		<h1 class="text-lg font-black">🔍 리뷰창</h1>
		<p class="mt-1 text-xs text-moai-dim">P4 changelist diff에 라인 단위로 코멘트하고, 승인하면 머지됩니다.</p>
	</header>

	{#each GROUPS as group (group.label)}
		{@const items = data.changelists
			.filter((c) => group.statuses.includes(c.status))
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
		{#if items.length > 0}
			<section class="mb-6">
				<div class="mb-2 flex items-baseline gap-2">
					<h2 class="text-xs font-bold tracking-wide">{group.label}</h2>
					<span class="text-[10px] text-moai-dim">{items.length}건{group.hint ? ` — ${group.hint}` : ''}</span>
				</div>
				<div class="panel divide-y divide-moai-border overflow-hidden">
					{#each items as cl (cl.id)}
						{@const agent = agentOf(cl.agentId)}
						{@const issue = issueOf(cl.issueId)}
						{@const meta = statusMeta(cl.status)}
						<a href={`/review/${cl.id}`} class="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-moai-hover">
							<span class="w-16 shrink-0 font-mono text-xs font-bold text-moai-gold">CL {cl.number}</span>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-[13px] font-semibold">{cl.title}</span>
									{#if cl.trunkFix}
										<span class="chip !border-day/40 !text-day"><Sun size={9} /> 트렁크 수정</span>
									{/if}
									{#if cl.contractViolations.length > 0}
										<span class="chip !border-danger/40 !text-danger"><ShieldAlert size={9} /> 계약 위반 {cl.contractViolations.length}</span>
									{/if}
								</div>
								<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-moai-dim">
									{#if agent}
										<span class="flex items-center gap-1">
											<MoaiAvatar traits={agent.persona.moai} size={16} />
											{agent.persona.name}
										</span>
									{/if}
									{#if issue}<span class="font-mono">{issue.key}</span>{/if}
									<span class="flex items-center gap-1"><FileCode2 size={11} /> 파일 {cl.files.length}</span>
									<span class="flex items-center gap-1"><MessageSquare size={11} /> 코멘트 {data.commentCounts[cl.id] ?? 0}</span>
									<span>{timeAgo(cl.createdAt)}</span>
								</div>
							</div>
							<div class="flex shrink-0 flex-col items-end gap-1.5">
								<span class="text-[11px] font-semibold {meta.class}">
									{#if cl.status === 'merged'}<GitMerge size={12} class="mr-0.5 inline" />{/if}
									{meta.label}
								</span>
								<span class="flex items-center gap-1 text-[10px] text-moai-dim">
									{#if cl.buildStatus === 'success'}
										<CheckCircle2 size={11} class="text-ok" /> 빌드 성공
									{:else if cl.buildStatus === 'failed'}
										<XCircle size={11} class="text-danger" /> 빌드 실패
									{:else}
										<Loader2 size={11} class="animate-spin text-info" /> 빌드 중
									{/if}
								</span>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{/each}
</div>
