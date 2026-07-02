<script lang="ts">
	import { enhance } from '$app/forms';
	import { KeyRound } from '@lucide/svelte';

	let { form } = $props();
	let busy = $state(false);
</script>

<svelte:head><title>로그인 · Gigantic 🗿</title></svelte:head>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-moai-bg p-4">
	<div class="panel w-full max-w-sm p-8">
		<div class="flex flex-col items-center text-center">
			<span class="text-5xl">🗿</span>
			<h1 class="mt-3 text-lg font-black tracking-wide text-moai-gold">GIGANTIC</h1>
			<p class="mt-1 text-xs text-moai-dim">밤에는 에이전트가, 아침에는 사람이</p>
		</div>

		<form
			method="POST"
			class="mt-7 flex flex-col gap-3"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					busy = false;
					await update();
				};
			}}
		>
			<label class="flex flex-col gap-1.5 text-xs">
				<span class="flex items-center gap-1.5 font-semibold"><KeyRound size={12} /> 대시보드 비밀번호</span>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					type="password"
					name="password"
					autofocus
					required
					class="rounded-md border border-moai-border-strong bg-moai-bg px-3 py-2.5 outline-none focus:border-moai-gold"
					placeholder="DASHBOARD_PASSWORD"
				/>
			</label>
			{#if form?.message}
				<p class="text-[11px] text-danger">{form.message}</p>
			{/if}
			<button class="btn-gold mt-1 py-2.5 text-sm" disabled={busy}>들어가기</button>
		</form>

		<p class="mt-5 text-center text-[10px] leading-relaxed text-moai-dim">
			접근 제어는 서버의 DASHBOARD_PASSWORD 환경변수로 켜고 끕니다
		</p>
	</div>
</div>
