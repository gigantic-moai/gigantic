<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { Agent, Issue, IssuePriority } from '@gigantic/shared';
	import Modal from './Modal.svelte';
	import MoaiAvatar from './MoaiAvatar.svelte';
	import { toast } from '$lib/stores/toast';
	import { issueKeyNum } from '$lib/utils';
	import { Lock, Trash2, Wand2 } from '@lucide/svelte';

	let {
		issue = null,
		issues,
		agents,
		onclose
	}: {
		/** null이면 새 이슈 생성 */
		issue?: Issue | null;
		issues: Issue[];
		agents: Agent[];
		onclose: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally -- 모달 오픈 시점에 모드가 고정되는 것이 의도
	const editing = issue !== null;
	const joinList = (v: string[] | undefined) => (v ?? []).join(', ');
	const splitList = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);

	// svelte-ignore state_referenced_locally -- 모달 오픈 시점 스냅샷이 의도된 동작
	let title = $state(issue?.title ?? '');
	// svelte-ignore state_referenced_locally
	let description = $state(issue?.description ?? '');
	// svelte-ignore state_referenced_locally
	let priority = $state<IssuePriority>(issue?.priority ?? 'p1');
	// svelte-ignore state_referenced_locally
	let tagsRaw = $state(joinList(issue?.tags));
	// svelte-ignore state_referenced_locally
	let filesRaw = $state(joinList(issue?.expectedFiles));
	// svelte-ignore state_referenced_locally
	let uassetsRaw = $state(joinList(issue?.uassets));
	// svelte-ignore state_referenced_locally
	let deps = $state<string[]>([...(issue?.deps ?? [])]);
	// 생성 시 기본은 자동 매칭, 편집 시 현재 담당
	// svelte-ignore state_referenced_locally
	let assignee = $state<string>(editing ? (issue?.assigneeId ?? '') : 'auto');
	let busy = $state(false);
	let confirmDelete = $state(false);

	const depCandidates = $derived(
		issues
			.filter((i) => i.id !== issue?.id)
			.sort((a, b) => issueKeyNum(a.key) - issueKeyNum(b.key))
	);

	function toggleDep(id: string) {
		deps = deps.includes(id) ? deps.filter((d) => d !== id) : [...deps, id];
	}

	async function save() {
		if (!title.trim()) {
			toast('제목은 필수입니다', 'warn');
			return;
		}
		busy = true;
		try {
			const payload = {
				title: title.trim(),
				description: description.trim(),
				priority,
				tags: splitList(tagsRaw),
				deps,
				expectedFiles: splitList(filesRaw),
				uassets: splitList(uassetsRaw),
				assigneeId: assignee
			};
			const res = editing
				? await fetch(`/api/issues/${issue!.id}`, {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ action: 'update', ...payload })
					})
				: await fetch('/api/issues', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify(payload)
					});
			const data = await res.json();
			if (!res.ok) {
				toast(data.reason ?? '저장에 실패했습니다', 'danger');
				return;
			}
			if (editing) {
				toast(`${issue!.key} 수정 완료`, 'ok');
			} else if (data.autoAssigned) {
				toast(`${data.issue.key} 생성 — 태그 매칭으로 ${data.autoAssigned}에게 자동 할당`, 'ok');
			} else {
				toast(`${data.issue.key} 생성 — ${assignee && assignee !== 'auto' ? '담당 지정됨' : '미할당 (매칭되는 태그 없음)'}`, 'ok');
			}
			if (data.conflicts?.length > 0) {
				toast(`.uasset 배타적 잠금이 ${data.conflicts.join(', ')}와 겹칩니다 — 야간 작업이 직렬화됩니다`, 'warn');
			}
			await invalidateAll();
			onclose();
		} finally {
			busy = false;
		}
	}

	async function remove() {
		if (!editing) return;
		busy = true;
		try {
			const res = await fetch(`/api/issues/${issue!.id}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ action: 'delete' })
			});
			const data = await res.json();
			if (!res.ok) {
				toast(data.reason ?? '삭제할 수 없습니다', 'danger');
				confirmDelete = false;
				return;
			}
			toast(`${issue!.key} 삭제됨`, 'ok');
			await invalidateAll();
			onclose();
		} finally {
			busy = false;
		}
	}
</script>

<Modal title={editing ? `${issue!.key} 편집` : '새 이슈'} {onclose} wide>
	<div class="flex flex-col gap-3.5">
		<div class="grid gap-3 sm:grid-cols-[1fr_110px]">
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">제목 <span class="text-danger">*</span></span>
				<input
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 outline-none focus:border-moai-gold"
					placeholder="예: LOD 스트리밍 allocation spike 제거"
					bind:value={title}
				/>
			</label>
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">우선순위</span>
				<select bind:value={priority} class="rounded-md border border-moai-border-strong bg-moai-bg px-2.5 py-2 outline-none focus:border-moai-gold">
					<option value="p0">P0 — 긴급</option>
					<option value="p1">P1 — 보통</option>
					<option value="p2">P2 — 낮음</option>
				</select>
			</label>
		</div>

		<label class="flex flex-col gap-1 text-xs">
			<span class="font-semibold">설명</span>
			<textarea
				rows="3"
				class="resize-y rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 leading-relaxed outline-none focus:border-moai-gold"
				placeholder="에이전트가 야간에 읽고 작업할 내용 — 구체적일수록 좋습니다"
				bind:value={description}
			></textarea>
		</label>

		<div class="grid gap-3 sm:grid-cols-2">
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">태그</span>
				<input
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 outline-none focus:border-moai-gold"
					placeholder="쉼표 구분 — 자동 할당 매칭 기준. 예: LOD, Profiling"
					bind:value={tagsRaw}
				/>
			</label>
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">담당</span>
				<select bind:value={assignee} class="rounded-md border border-moai-border-strong bg-moai-bg px-2.5 py-2 outline-none focus:border-moai-gold">
					{#if !editing}
						<option value="auto">⚡ 자동 — 전문 태그 매칭</option>
					{/if}
					<option value="">미할당</option>
					{#each agents.filter((a) => a.onboarding.step >= 7) as a (a.id)}
						<option value={a.id}>🗿 {a.persona.name} — {a.persona.role}</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">변경 예상 파일</span>
				<input
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 font-mono text-[11px] outline-none focus:border-moai-gold"
					placeholder="쉼표 구분 — Source/.../Foo.cpp"
					bind:value={filesRaw}
				/>
			</label>
			<label class="flex flex-col gap-1 text-xs">
				<span class="flex items-center gap-1 font-semibold"><Lock size={11} class="text-warn" /> 배타적 잠금 .uasset</span>
				<input
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 font-mono text-[11px] outline-none focus:border-moai-gold"
					placeholder="쉼표 구분 — 같은 에셋의 이슈는 직렬화됩니다"
					bind:value={uassetsRaw}
				/>
			</label>
		</div>

		<div class="flex flex-col gap-1 text-xs">
			<span class="font-semibold">의존 이슈 — 워터폴 보드의 spawn 순서를 결정</span>
			<div class="max-h-36 overflow-y-auto rounded-md border border-moai-border-strong bg-moai-bg p-1.5">
				{#each depCandidates as cand (cand.id)}
					<label class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-moai-hover">
						<input
							type="checkbox"
							checked={deps.includes(cand.id)}
							onchange={() => toggleDep(cand.id)}
							style="accent-color: var(--color-moai-gold)"
						/>
						<span class="font-mono text-[11px] font-bold text-moai-gold">{cand.key}</span>
						<span class="min-w-0 flex-1 truncate text-[11px]">{cand.title}</span>
						<span class="chip !py-0.5">{cand.status}</span>
					</label>
				{/each}
			</div>
		</div>

		{#if !editing}
			<div class="flex items-start gap-2 rounded-lg border border-info/25 bg-info/5 px-3 py-2.5 text-[11px] leading-relaxed text-moai-muted">
				<Wand2 size={13} class="mt-0.5 shrink-0 text-info" />
				<span>
					To Do에 추가됩니다. 밤이 되면 담당 에이전트가 의존성·충돌 분석 순서에 따라 가져가 작업합니다.
					담당을 "자동"으로 두면 전문 태그가 가장 많이 겹치는 에이전트에게 할당됩니다.
				</span>
			</div>
		{/if}

		<div class="flex items-center gap-2 border-t border-moai-border pt-4">
			{#if editing}
				{#if confirmDelete}
					<span class="text-[11px] text-danger">정말 삭제할까요?</span>
					<button class="btn-ghost px-3 py-2 text-xs !border-danger !text-danger" disabled={busy} onclick={remove}>삭제 확정</button>
					<button class="btn-ghost px-3 py-2 text-xs" onclick={() => (confirmDelete = false)}>취소</button>
				{:else}
					<button
						class="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs hover:!border-danger hover:!text-danger"
						onclick={() => (confirmDelete = true)}
					>
						<Trash2 size={12} /> 삭제
					</button>
				{/if}
			{/if}
			<div class="ml-auto flex items-center gap-2">
				{#if assignee && assignee !== 'auto' && assignee !== ''}
					{@const a = agents.find((x) => x.id === assignee)}
					{#if a}<MoaiAvatar traits={a.persona.moai} size={22} title={a.persona.name} />{/if}
				{/if}
				<button class="btn-ghost px-4 py-2 text-xs" onclick={onclose}>취소</button>
				<button class="btn-gold px-5 py-2 text-xs" disabled={busy} onclick={save}>
					{editing ? '저장' : '이슈 추가'}
				</button>
			</div>
		</div>
	</div>
</Modal>
