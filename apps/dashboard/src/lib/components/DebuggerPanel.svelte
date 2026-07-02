<script lang="ts">
	import type { Agent } from '@gigantic/shared';
	import {
		Bug,
		ChevronsRight,
		CornerDownRight,
		CornerUpRight,
		ExternalLink,
		Pause,
		Play,
		PlugZap
	} from '@lucide/svelte';

	let { agent }: { agent: Agent } = $props();

	// BR-03 (DAP) — 구현은 외부 Quilla 디버거가 담당한다.
	// 이 패널은 Quilla가 노출하는 DAP 세션의 임베드 지점(UI 셸)이다.
	const QUILLA_URL = 'https://github.com/zaffre001/quilla';
</script>

<div class="panel overflow-hidden">
	<div class="flex flex-wrap items-center gap-2 border-b border-moai-border bg-moai-surface px-4 py-2.5">
		<Bug size={14} class="text-moai-gold" />
		<span class="text-xs font-bold">디버거 (DAP)</span>
		<span class="chip">Quilla 제공</span>
		<span class="ml-auto inline-flex items-center gap-1.5 text-[11px] text-moai-dim">
			<span class="h-1.5 w-1.5 rounded-full bg-moai-dim"></span>
			세션 없음
		</span>
	</div>

	<!-- DAP 컨트롤 (세션 연결 시 활성화) -->
	<div class="flex items-center gap-1 border-b border-moai-border px-3 py-2">
		<button class="btn-ghost p-1.5" disabled title="계속 (F5)"><Play size={13} /></button>
		<button class="btn-ghost p-1.5" disabled title="일시 정지"><Pause size={13} /></button>
		<button class="btn-ghost p-1.5" disabled title="스텝 오버 (F10)"><ChevronsRight size={13} /></button>
		<button class="btn-ghost p-1.5" disabled title="스텝 인 (F11)"><CornerDownRight size={13} /></button>
		<button class="btn-ghost p-1.5" disabled title="스텝 아웃 (Shift+F11)"><CornerUpRight size={13} /></button>
		<span class="ml-2 text-[11px] text-moai-dim">브레이크포인트 · 변수 · 콜스택 — DAP 세션 연결 시 표시</span>
	</div>

	<div class="grid grid-cols-1 gap-px bg-moai-border sm:grid-cols-3">
		{#each ['브레이크포인트', '변수', '콜스택'] as pane (pane)}
			<div class="bg-moai-panel px-4 py-3">
				<div class="text-[10px] font-bold tracking-wider text-moai-dim uppercase">{pane}</div>
				<div class="mt-2 text-[11px] text-moai-dim">—</div>
			</div>
		{/each}
	</div>

	<div class="flex items-start gap-2.5 border-t border-moai-border bg-moai-surface px-4 py-3">
		<PlugZap size={14} class="mt-0.5 shrink-0 text-info" />
		<p class="text-[11px] leading-relaxed text-moai-muted">
			{agent.persona.name}의 UE 디버깅은 외부 디버거 <span class="font-semibold text-moai-text">Quilla</span>가
			담당합니다. Quilla가 이 플랫폼을 포함(임베드)하며, 브레이크포인트 제어 · 스텝 실행 · 변수/콜스택 읽기는
			Quilla의 DAP 세션이 이 패널에 연결됩니다.
			<a
				href={QUILLA_URL}
				target="_blank"
				rel="noreferrer"
				class="inline-flex items-center gap-0.5 whitespace-nowrap text-moai-gold hover:underline"
			>
				zaffre001/quilla <ExternalLink size={10} />
			</a>
		</p>
	</div>
</div>
