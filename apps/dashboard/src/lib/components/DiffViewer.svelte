<script lang="ts">
	import type { Agent, DiffLine, FileDiff, ReviewComment } from '@gigantic/shared';
	import CommentThread from './CommentThread.svelte';
	import { FileCode2, FilePlus2, FileX2, Lock, MessageSquarePlus } from '@lucide/svelte';

	let {
		file,
		comments,
		agents,
		onComment
	}: {
		file: FileDiff;
		/** 이 파일에 달린 코멘트 전체 (스레드 포함) */
		comments: ReviewComment[];
		agents: Agent[];
		onComment: (input: {
			line?: number;
			lineType?: DiffLine['type'];
			body: string;
			parentId?: string;
		}) => void | Promise<void>;
	} = $props();

	let composerAt = $state<string | null>(null);
	let composerBody = $state('');

	/** diff 라인의 코멘트 앵커 번호 — del은 oldNo, 나머지는 newNo (RV-02) */
	const anchorOf = (l: DiffLine) => (l.type === 'del' ? l.oldNo : l.newNo);
	const lineKey = (l: DiffLine) => `${l.type}:${anchorOf(l)}`;

	const rootsAt = (l: DiffLine) =>
		comments
			.filter((c) => !c.parentId && c.line === anchorOf(l) && (c.lineType ?? l.type) === l.type)
			.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

	async function submitComposer(l: DiffLine) {
		const body = composerBody.trim();
		if (!body) return;
		composerBody = '';
		composerAt = null;
		await onComment({ line: anchorOf(l), lineType: l.type, body });
	}

	const actionMeta = $derived(
		file.action === 'add'
			? { label: '추가', class: 'text-ok' }
			: file.action === 'delete'
				? { label: '삭제', class: 'text-danger' }
				: { label: '수정', class: 'text-warn' }
	);
	const stats = $derived.by(() => {
		let add = 0;
		let del = 0;
		for (const h of file.hunks)
			for (const l of h.lines) {
				if (l.type === 'add') add++;
				if (l.type === 'del') del++;
			}
		return { add, del };
	});
</script>

<div class="panel overflow-hidden">
	<!-- 파일 헤더 -->
	<div class="flex flex-wrap items-center gap-2.5 border-b border-moai-border bg-moai-surface px-4 py-2.5">
		{#if file.binary}
			<Lock size={14} class="text-moai-gold" />
		{:else if file.action === 'add'}
			<FilePlus2 size={14} class="text-ok" />
		{:else if file.action === 'delete'}
			<FileX2 size={14} class="text-danger" />
		{:else}
			<FileCode2 size={14} class="text-warn" />
		{/if}
		<code class="text-xs font-medium break-all">{file.path}</code>
		<span class="chip !py-0.5 {actionMeta.class}">{actionMeta.label}</span>
		{#if !file.binary}
			<span class="ml-auto text-[11px] whitespace-nowrap">
				<span class="text-ok">+{stats.add}</span>
				<span class="ml-1 text-danger">−{stats.del}</span>
			</span>
		{/if}
	</div>

	{#if file.binary}
		<div class="flex items-center gap-3 px-4 py-4 text-xs text-moai-muted">
			<Lock size={16} class="shrink-0 text-moai-gold" />
			<div>
				바이너리 에셋 — 텍스트 diff를 제공하지 않습니다.
				<span class="text-moai-text">P4 배타적 잠금</span>으로 보호되며, 에디터에서 확인하세요.
			</div>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full border-collapse">
				<tbody>
					{#each file.hunks as h, hi (hi)}
						<tr>
							<td colspan="4" class="bg-moai-raised px-4 py-1 font-mono text-[10px] text-moai-dim">
								{h.header}
							</td>
						</tr>
						{#each h.lines as l (lineKey(l) + '-' + hi)}
							{@const roots = rootsAt(l)}
							<tr
								class="group {l.type === 'add'
									? 'bg-diff-add'
									: l.type === 'del'
										? 'bg-diff-del'
										: ''} hover:brightness-125"
							>
								<td class="w-10 min-w-10 border-r border-moai-border px-1 text-right font-mono text-[10px] text-moai-dim select-none">
									{l.oldNo ?? ''}
								</td>
								<td class="w-10 min-w-10 border-r border-moai-border px-1 text-right font-mono text-[10px] text-moai-dim select-none">
									{l.newNo ?? ''}
								</td>
								<td class="w-6 min-w-6 text-center select-none">
									<button
										class="invisible text-moai-gold group-hover:visible"
										title="이 라인에 코멘트"
										aria-label="이 라인에 코멘트"
										onclick={() => {
											composerAt = composerAt === lineKey(l) ? null : lineKey(l);
											composerBody = '';
										}}
									>
										<MessageSquarePlus size={13} />
									</button>
								</td>
								<td class="diff-code w-full pr-4 {l.type === 'add' ? 'text-diff-add-text' : l.type === 'del' ? 'text-diff-del-text' : 'text-moai-muted'}">
									<span class="mr-2 inline-block w-3 select-none {l.type === 'add' ? 'text-ok' : l.type === 'del' ? 'text-danger' : 'text-moai-dim'}">
										{l.type === 'add' ? '+' : l.type === 'del' ? '−' : ' '}
									</span>{l.text}
								</td>
							</tr>
							{#if composerAt === lineKey(l)}
								<tr>
									<td colspan="4" class="border-y border-moai-border bg-moai-surface px-4 py-2.5">
										<div class="flex gap-2">
											<!-- svelte-ignore a11y_autofocus -->
											<input
												class="min-w-0 flex-1 rounded-md border border-moai-border-strong bg-moai-bg px-2.5 py-1.5 text-xs outline-none focus:border-moai-gold"
												placeholder={`L${anchorOf(l)}에 코멘트 — 에이전트에게 피드백으로 전달됩니다`}
												autofocus
												bind:value={composerBody}
												onkeydown={(e) => {
													if (e.key === 'Enter' && !e.isComposing) submitComposer(l);
													if (e.key === 'Escape') composerAt = null;
												}}
											/>
											<button class="btn-gold px-3 py-1.5 text-xs" onclick={() => submitComposer(l)}>
												코멘트
											</button>
										</div>
									</td>
								</tr>
							{/if}
							{#if roots.length > 0}
								<tr>
									<td colspan="4" class="border-y border-moai-border bg-moai-bg px-4 py-2.5">
										<CommentThread
											{roots}
											all={comments}
											{agents}
											onReply={(parentId, body) => onComment({ line: anchorOf(l), lineType: l.type, body, parentId })}
										/>
									</td>
								</tr>
							{/if}
						{/each}
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
