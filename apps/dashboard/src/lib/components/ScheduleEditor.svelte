<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { Agent, AgentSchedule } from '@gigantic/shared';
	import { toast } from '$lib/stores/toast';
	import { CalendarClock, Moon, Sun } from '@lucide/svelte';

	let { agent }: { agent: Agent } = $props();

	const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

	// svelte-ignore state_referenced_locally -- 편집용 로컬 복사본이 의도된 동작
	let schedule = $state<AgentSchedule>({ ...agent.schedule, weekdays: [...agent.schedule.weekdays] });
	let busy = $state(false);

	function toggleDay(d: number) {
		schedule.weekdays = schedule.weekdays.includes(d)
			? schedule.weekdays.filter((x) => x !== d)
			: [...schedule.weekdays, d].sort();
	}

	async function save() {
		busy = true;
		try {
			await fetch(`/api/agents/${agent.id}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ action: 'schedule', schedule })
			});
			toast('스케줄이 저장되었습니다 — 다음 주기부터 적용됩니다', 'ok');
			await invalidateAll();
		} finally {
			busy = false;
		}
	}
</script>

<div class="panel p-5">
	<div class="flex items-center gap-2">
		<CalendarClock size={15} class="text-moai-gold" />
		<h3 class="text-sm font-bold">스케줄 — 스폰은 한 번, 이후는 자율 운영</h3>
	</div>

	<div class="mt-4 flex flex-col gap-4">
		<div class="rounded-lg border border-moai-border bg-moai-surface p-3.5">
			<div class="flex items-center gap-1.5 text-xs font-semibold text-night">
				<Moon size={13} class="shrink-0" />
				<span class="min-w-0">야간 모드 — 이슈 작업</span>
			</div>
			<div class="mt-3 flex items-end gap-2.5">
				<label class="flex min-w-0 flex-1 flex-col gap-1 text-xs">
					<span class="text-[10px] text-moai-dim">시작</span>
					<input
						type="time"
						bind:value={schedule.nightStart}
						class="w-full min-w-0 rounded-md border border-moai-border-strong bg-moai-bg px-2 py-1.5 outline-none focus:border-moai-gold"
					/>
				</label>
				<span class="shrink-0 pb-2 text-xs text-moai-dim">→</span>
				<label class="flex min-w-0 flex-1 flex-col gap-1 text-xs">
					<span class="text-[10px] text-moai-dim">종료</span>
					<input
						type="time"
						bind:value={schedule.nightEnd}
						class="w-full min-w-0 rounded-md border border-moai-border-strong bg-moai-bg px-2 py-1.5 outline-none focus:border-moai-gold"
					/>
				</label>
			</div>
			<p class="mt-2.5 text-[10px] leading-relaxed text-moai-dim">
				할당된 이슈를 자율 작업 → 완료 시 리뷰 요청 → 아침 스크럼 작성
			</p>
		</div>

		<div class="rounded-lg border border-moai-border bg-moai-surface p-3.5">
			<div class="flex items-center justify-between gap-3">
				<div class="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-day">
					<Sun size={13} class="shrink-0" />
					<span class="min-w-0">주간 모드 — 트렁크 감시</span>
				</div>
				<label class="flex shrink-0 cursor-pointer items-center gap-1.5 text-[10px] whitespace-nowrap text-moai-muted">
					<input
						type="checkbox"
						bind:checked={schedule.dayWatchEnabled}
						style="accent-color: var(--color-moai-gold)"
					/>
					활성화
				</label>
			</div>
			<div class="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
				<label class="flex flex-col gap-1 text-xs">
					<span class="text-[10px] text-moai-dim">감시 주기 (분)</span>
					<input
						type="number"
						min="5"
						max="240"
						step="5"
						bind:value={schedule.trunkWatchMinutes}
						disabled={!schedule.dayWatchEnabled}
						class="w-24 rounded-md border border-moai-border-strong bg-moai-bg px-2 py-1.5 outline-none focus:border-moai-gold disabled:opacity-40"
					/>
				</label>
				<div class="flex flex-col gap-1">
					<span class="text-[10px] text-moai-dim">감시 요일</span>
					<div class="flex gap-1">
						{#each DAYS as d, i (i)}
							<button
								class="h-7 w-7 shrink-0 rounded-md border text-[11px] transition-colors {schedule.weekdays.includes(i)
									? 'border-moai-gold bg-moai-gold-faint font-bold text-moai-gold'
									: 'border-moai-border-strong text-moai-dim hover:bg-moai-hover'} disabled:opacity-40"
								disabled={!schedule.dayWatchEnabled}
								onclick={() => toggleDay(i)}
							>
								{d}
							</button>
						{/each}
					</div>
				</div>
			</div>
			<p class="mt-2.5 text-[10px] leading-relaxed text-moai-dim">
				빌드 깨짐 · 리그레션 · 계약 위반 감지 시 자동 수정 후 리뷰 요청
			</p>
		</div>
	</div>

	<button class="btn-gold mt-4 px-4 py-2 text-xs" disabled={busy} onclick={save}>스케줄 저장</button>
</div>
