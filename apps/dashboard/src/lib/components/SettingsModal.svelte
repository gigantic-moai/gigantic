<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { GiganticSettings, LlmProvider } from '@gigantic/shared';
	import { LLM_PROVIDERS, THEME_ACCENTS, type ThemeAccent } from '@gigantic/shared';
	import Modal from './Modal.svelte';
	import { applyTheme, previewTheme } from '$lib/theme';
	import { toast } from '$lib/stores/toast';
	import {
		Cpu,
		FolderCog,
		GitBranch,
		KeyRound,
		Moon,
		Network,
		Palette,
		Sun,
		Wrench
	} from '@lucide/svelte';

	let { settings, onclose }: { settings: GiganticSettings; onclose: () => void } = $props();

	// 편집용 로컬 복사본 — 저장 전까지 서버 상태를 건드리지 않는다
	// svelte-ignore state_referenced_locally -- 모달 오픈 시점 스냅샷이 의도된 동작
	let local = $state<GiganticSettings>(structuredClone($state.snapshot(settings)));
	let apiKeyInput = $state('');
	let busy = $state(false);

	const providers = Object.keys(LLM_PROVIDERS) as LlmProvider[];
	const accents = Object.keys(THEME_ACCENTS) as ThemeAccent[];

	function setTheme(patch: Partial<GiganticSettings['theme']>) {
		local.theme = { ...local.theme, ...patch };
		previewTheme(local.theme); // 즉시 미리보기
	}

	function close() {
		previewTheme(settings.theme); // 저장 안 한 테마 미리보기 되돌리기
		onclose();
	}

	async function save() {
		busy = true;
		try {
			const res = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					settings: $state.snapshot(local),
					apiKey: apiKeyInput || undefined
				})
			});
			if (!res.ok) {
				toast('설정 저장에 실패했습니다', 'danger');
				return;
			}
			applyTheme(local.theme);
			toast('환경설정이 저장되었습니다', 'ok');
			await invalidateAll();
			onclose();
		} finally {
			busy = false;
		}
	}
</script>

{#snippet field(label: string, hint: string | undefined, mono: boolean, get: () => string, set: (v: string) => void)}
	<label class="flex min-w-0 flex-col gap-1 text-xs">
		<span class="font-semibold">{label}</span>
		<input
			class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 outline-none focus:border-moai-gold {mono ? 'font-mono text-[11px]' : ''}"
			value={get()}
			oninput={(e) => set(e.currentTarget.value)}
		/>
		{#if hint}<span class="text-[10px] text-moai-dim">{hint}</span>{/if}
	</label>
{/snippet}

{#snippet sectionHeader(icon: typeof Palette, title: string, desc: string)}
	{@const Icon = icon}
	<div class="mt-6 mb-3 first:mt-0">
		<div class="flex items-center gap-2 text-xs font-bold">
			<Icon size={14} class="text-moai-gold" />
			{title}
		</div>
		<p class="mt-0.5 text-[10px] text-moai-dim">{desc}</p>
	</div>
{/snippet}

<Modal title="⚙️ 환경설정" onclose={close} wide>
	<div class="max-h-[65vh] overflow-y-auto pr-1">
		<!-- 테마 -->
		{@render sectionHeader(Palette, '테마', '변경 즉시 미리보기 — 저장해야 유지됩니다')}
		<div class="flex flex-wrap items-center gap-5">
			<div class="flex overflow-hidden rounded-lg border border-moai-border-strong">
				<button
					class="flex items-center gap-1.5 px-3.5 py-2 text-xs {local.theme.mode === 'dark'
						? 'bg-moai-gold-faint font-semibold text-moai-gold'
						: 'text-moai-muted hover:bg-moai-hover'}"
					onclick={() => setTheme({ mode: 'dark' })}
				>
					<Moon size={12} /> 다크 (기본)
				</button>
				<button
					class="flex items-center gap-1.5 px-3.5 py-2 text-xs {local.theme.mode === 'light'
						? 'bg-moai-gold-faint font-semibold text-moai-gold'
						: 'text-moai-muted hover:bg-moai-hover'}"
					onclick={() => setTheme({ mode: 'light' })}
				>
					<Sun size={12} /> 라이트
				</button>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-[11px] text-moai-dim">액센트</span>
				{#each accents as a (a)}
					<button
						class="flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 {local.theme.accent === a
							? 'border-moai-text'
							: 'border-transparent'}"
						title={THEME_ACCENTS[a].label}
						aria-label={`액센트 ${THEME_ACCENTS[a].label}`}
						onclick={() => setTheme({ accent: a })}
					>
						<span class="h-4.5 w-4.5 rounded-full" style={`background:${THEME_ACCENTS[a].color}`}></span>
					</button>
				{/each}
				<span class="text-[11px] text-moai-muted">{THEME_ACCENTS[local.theme.accent].label}</span>
			</div>
		</div>

		<!-- Perforce -->
		{@render sectionHeader(GitBranch, 'Perforce 연결', '하드 디펜던시 — 이미 운영 중인 P4 서버에 연결만 합니다')}
		<div class="grid gap-3 sm:grid-cols-2">
			{@render field('P4PORT', 'ssl:호스트:포트', true, () => local.p4.port, (v) => (local.p4.port = v))}
			{@render field('P4USER', '에이전트 전용 계정 권장', true, () => local.p4.user, (v) => (local.p4.user = v))}
			<div class="sm:col-span-2">
				{@render field('P4DEPOT', '에이전트가 작업할 depot 뷰', true, () => local.p4.depot, (v) => (local.p4.depot = v))}
			</div>
		</div>

		<!-- 경로 -->
		{@render sectionHeader(FolderCog, '경로', 'UE 브릿지와 병렬화 엔진이 사용하는 로컬/네트워크 경로')}
		<div class="grid gap-3 sm:grid-cols-2">
			{@render field('UE 엔진 경로', '브릿지 플러그인 설치 대상', true, () => local.paths.ueEngine, (v) => (local.paths.ueEngine = v))}
			{@render field('UE 프로젝트 (.uproject)', undefined, true, () => local.paths.ueProject, (v) => (local.paths.ueProject = v))}
			{@render field('Shared DDC 경로', '워크스페이스 간 셰이더/DDC 캐시 공유', true, () => local.paths.sharedDdc, (v) => (local.paths.sharedDdc = v))}
			{@render field('워크스페이스 루트', '에이전트별 P4 워크스페이스 생성 위치', true, () => local.paths.workspaceRoot, (v) => (local.paths.workspaceRoot = v))}
		</div>

		<!-- CI -->
		{@render sectionHeader(Wrench, 'CI (젠킨스)', 'Gigantic은 빌드 결과를 읽기만 합니다 — 파이프라인은 건드리지 않습니다')}
		<div class="grid gap-3 sm:grid-cols-2">
			{@render field('젠킨스 URL', undefined, true, () => local.ci.jenkinsUrl, (v) => (local.ci.jenkinsUrl = v))}
			{@render field('감시할 Job', '트렁크 감시가 이 Job의 상태를 읽습니다', true, () => local.ci.jenkinsJob, (v) => (local.ci.jenkinsJob = v))}
		</div>

		<!-- LLM -->
		{@render sectionHeader(Cpu, 'LLM 백엔드', '에이전트가 사용하는 모델')}
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">프로바이더</span>
				<select
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 outline-none focus:border-moai-gold"
					value={local.llm.provider}
					onchange={(e) => {
						const p = e.currentTarget.value as LlmProvider;
						local.llm.provider = p;
						local.llm.model = LLM_PROVIDERS[p].defaultModel;
					}}
				>
					{#each providers as p (p)}
						<option value={p}>{LLM_PROVIDERS[p].label}</option>
					{/each}
				</select>
			</label>
			{@render field('모델', undefined, true, () => local.llm.model, (v) => (local.llm.model = v))}
			<label class="flex flex-col gap-1 text-xs sm:col-span-2">
				<span class="flex items-center gap-1.5 font-semibold"><KeyRound size={11} /> API 키</span>
				<input
					type="password"
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 font-mono text-[11px] outline-none focus:border-moai-gold"
					placeholder={local.llm.apiKeySet ? '●●●●●●●● 설정됨 — 변경하려면 새 키 입력' : '키를 입력하세요'}
					bind:value={apiKeyInput}
				/>
				<span class="text-[10px] text-moai-dim">키는 서버에만 저장되며 대시보드에 다시 표시되지 않습니다</span>
			</label>
		</div>

		<!-- 포트 -->
		{@render sectionHeader(Network, '포트', '컨테이너 재시작 후 적용됩니다')}
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">대시보드 포트</span>
				<input
					type="number"
					min="1"
					max="65535"
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 font-mono text-[11px] outline-none focus:border-moai-gold"
					bind:value={local.network.dashboardPort}
				/>
			</label>
			<label class="flex flex-col gap-1 text-xs">
				<span class="font-semibold">오케스트레이터 포트</span>
				<input
					type="number"
					min="1"
					max="65535"
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2 font-mono text-[11px] outline-none focus:border-moai-gold"
					bind:value={local.network.orchestratorPort}
				/>
			</label>
		</div>
	</div>

	<div class="mt-5 flex items-center justify-end gap-2 border-t border-moai-border pt-4">
		<button class="btn-ghost px-4 py-2 text-xs" onclick={close}>취소</button>
		<button class="btn-gold px-5 py-2 text-xs" disabled={busy} onclick={save}>저장</button>
	</div>
</Modal>
