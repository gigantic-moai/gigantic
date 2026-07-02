<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import {
		MOAI_ACCESSORIES,
		MOAI_EYES,
		MOAI_FACE_WIDTHS,
		MOAI_MOUTHS,
		MOAI_STONES,
		type MoaiTraits
	} from '@gigantic/shared';
	import Modal from './Modal.svelte';
	import MoaiAvatar from './MoaiAvatar.svelte';
	import { randomMoai, TRAIT_COUNTS } from '$lib/moai';
	import { toast } from '$lib/stores/toast';
	import { ChevronLeft, ChevronRight, Dices } from '@lucide/svelte';

	let { onclose }: { onclose: () => void } = $props();

	let name = $state('');
	let role = $state('');
	let personality = $state('');
	let tagsRaw = $state('');
	let traits = $state<MoaiTraits>(randomMoai(Math.floor(Math.random() * 2 ** 31)));
	let busy = $state(false);

	const traitRows = $derived([
		{ key: 'stone' as const, label: '돌 색상', names: MOAI_STONES.map((s) => s.label) },
		{ key: 'faceWidth' as const, label: '얼굴폭', names: [...MOAI_FACE_WIDTHS] },
		{ key: 'eyes' as const, label: '눈', names: [...MOAI_EYES] },
		{ key: 'mouth' as const, label: '입', names: [...MOAI_MOUTHS] },
		{ key: 'accessory' as const, label: '악세서리', names: [...MOAI_ACCESSORIES] }
	]);

	function cycle(key: keyof MoaiTraits, dir: 1 | -1) {
		const count = TRAIT_COUNTS[key];
		traits = { ...traits, [key]: (traits[key] + dir + count) % count };
	}

	async function spawn() {
		if (!name.trim() || !role.trim()) {
			toast('이름과 역할은 필수입니다', 'warn');
			return;
		}
		busy = true;
		try {
			const res = await fetch('/api/agents', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					persona: {
						name: name.trim(),
						role: role.trim(),
						personality: personality.trim(),
						tags: tagsRaw
							.split(',')
							.map((t) => t.trim())
							.filter(Boolean),
						moai: traits
					}
				})
			});
			const data = await res.json();
			if (!res.ok) {
				toast(data.reason ?? '스폰에 실패했습니다', 'danger');
				return;
			}
			toast(`🗿 ${name.trim()} 스폰 — 채석장에서 돌 깎기와 지식 학습을 시작합니다`, 'ok');
			onclose();
			await invalidateAll();
			await goto(`/agents/${data.agent.id}`);
		} finally {
			busy = false;
		}
	}
</script>

<Modal title="🗿 에이전트 스폰 — 페르소나 생성" {onclose} wide>
	<div class="grid gap-5 sm:grid-cols-[220px_1fr]">
		<!-- 모아이 아바타 -->
		<div class="flex flex-col items-center gap-3">
			<div class="rounded-xl border border-moai-border bg-moai-surface p-4">
				<MoaiAvatar {traits} size={150} title="모아이 미리보기" />
			</div>
			<button
				class="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
				onclick={() => (traits = randomMoai(Math.floor(Math.random() * 2 ** 31)))}
			>
				<Dices size={13} /> 다른 돌 고르기
			</button>
			<p class="text-center text-[10px] leading-relaxed text-moai-dim">
				스폰하면 채석장에서 이 돌이<br />깎여 모아이가 됩니다
			</p>
			<div class="flex w-full flex-col gap-1">
				{#each traitRows as row (row.key)}
					<div class="flex items-center justify-between gap-1 text-[11px]">
						<span class="w-12 shrink-0 text-moai-dim">{row.label}</span>
						<button class="btn-ghost border-none p-1" onclick={() => cycle(row.key, -1)} aria-label={`${row.label} 이전`}>
							<ChevronLeft size={12} />
						</button>
						<span class="flex-1 truncate text-center text-moai-muted">{row.names[traits[row.key]]}</span>
						<button class="btn-ghost border-none p-1" onclick={() => cycle(row.key, 1)} aria-label={`${row.label} 다음`}>
							<ChevronRight size={12} />
						</button>
					</div>
				{/each}
			</div>
		</div>

		<!-- 페르소나 -->
		<div class="flex flex-col gap-3">
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">이름 <span class="text-danger">*</span></span>
				<input
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 outline-none focus:border-moai-gold"
					placeholder="예: 코어"
					bind:value={name}
				/>
			</label>
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">역할 <span class="text-danger">*</span></span>
				<input
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 outline-none focus:border-moai-gold"
					placeholder="예: C++ 엔진 프로그래머 — 시스템 프롬프트의 전문 분야를 결정"
					bind:value={role}
				/>
			</label>
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">성격</span>
				<textarea
					rows="3"
					class="resize-none rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 outline-none focus:border-moai-gold"
					placeholder="작업 스타일과 톤 — 스크럼 로그에서 캐릭터성으로 드러납니다. 예: 꼼꼼하고 보수적, 퍼포먼스 최우선"
					bind:value={personality}
				></textarea>
			</label>
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">전문 태그</span>
				<input
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 outline-none focus:border-moai-gold"
					placeholder="쉼표로 구분 — 이슈 자동 할당 매칭 기준. 예: Core, Memory, Threading"
					bind:value={tagsRaw}
				/>
			</label>

			<div class="rounded-lg border border-info/25 bg-info/5 px-3.5 py-3 text-[11px] leading-relaxed text-moai-muted">
				스폰 직후 <span class="font-semibold text-info">온보딩</span>이 시작됩니다 — 돌이 깎여 모아이가 되고,
				프로젝트에 축적된 지식을 학습합니다. 지식 요약을 승인해야 🗿 모아이가 완성되어 작업을 시작할 수
				있습니다. 스폰은 이번 한 번 — 이후는 스케줄에 따라 자율 운영됩니다.
			</div>

			<div class="mt-1 flex justify-end gap-2">
				<button class="btn-ghost px-4 py-2 text-xs" onclick={onclose}>취소</button>
				<button class="btn-gold px-5 py-2 text-xs" disabled={busy} onclick={spawn}>🗿 Spawn</button>
			</div>
		</div>
	</div>
</Modal>
