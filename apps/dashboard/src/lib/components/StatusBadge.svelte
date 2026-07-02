<script lang="ts">
	import type { AgentStatus } from '@gigantic/shared';

	let { status, size = 'md' }: { status: AgentStatus | string; size?: 'sm' | 'md' } = $props();

	const meta = $derived(
		(
			{
				'night-work': { label: '🌙 야간 작업', color: 'var(--color-night)', pulse: true },
				'day-watch': { label: '☀️ 트렁크 감시', color: 'var(--color-day)', pulse: true },
				idle: { label: '대기', color: 'var(--color-moai-muted)', pulse: false },
				onboarding: { label: '📚 온보딩 중', color: 'var(--color-info)', pulse: true },
				'awaiting-approval': { label: '지식 승인 대기', color: 'var(--color-warn)', pulse: true },
				paused: { label: '⏸ 일시 정지', color: 'var(--color-moai-dim)', pulse: false }
			} as Record<string, { label: string; color: string; pulse: boolean }>
		)[status] ?? { label: String(status), color: 'var(--color-moai-muted)', pulse: false }
	);
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full border border-moai-border-strong bg-moai-raised font-medium whitespace-nowrap
	{size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}"
	style={`color: ${meta.color}`}
>
	<span
		class="inline-block h-1.5 w-1.5 rounded-full {meta.pulse ? 'animate-pulse' : ''}"
		style={`background: ${meta.color}`}
	></span>
	{meta.label}
</span>
