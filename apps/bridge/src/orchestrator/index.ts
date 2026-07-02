/**
 * 오케스트레이터 코어 (B-1 초기 구현) — 에이전트 스케줄 판정.
 * 대시보드 엔진과 같은 규칙(§11)을 브릿지 쪽 계약으로 고정한다.
 */
import type { AgentSchedule } from '@gigantic/shared';

export type AgentMode = 'night-work' | 'day-watch' | 'idle';

export function scheduledMode(schedule: AgentSchedule, now: Date, hasIssue: boolean): AgentMode {
	const [nsH, nsM] = schedule.nightStart.split(':').map(Number);
	const [neH, neM] = schedule.nightEnd.split(':').map(Number);
	const cur = now.getHours() * 60 + now.getMinutes();
	const start = nsH * 60 + (nsM || 0);
	const end = neH * 60 + (neM || 0);
	const inNight = start > end ? cur >= start || cur < end : cur >= start && cur < end;

	if (inNight) return hasIssue ? 'night-work' : 'idle';
	if (schedule.weekdays.includes(now.getDay()) && schedule.dayWatchEnabled) return 'day-watch';
	return 'idle';
}

/** 다음 트렁크 감시 시각 (☀️ 주간 모드) */
export function nextTrunkCheck(schedule: AgentSchedule, lastCheck: Date): Date {
	return new Date(lastCheck.getTime() + schedule.trunkWatchMinutes * 60_000);
}
