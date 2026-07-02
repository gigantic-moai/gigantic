import { getEngine } from '$lib/server/engine/state';
import type { OverviewKpis } from '@gigantic/shared';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { state } = await getEngine();
	const kpis: OverviewKpis = {
		openIssues: state.issues.filter((i) => i.status !== 'done').length,
		activeAgents: state.agents.filter((a) => ['night-work', 'day-watch'].includes(a.status)).length,
		totalAgents: state.agents.length,
		buildSuccessRate: state.kpi.buildSuccessRate,
		buildsToday: state.kpi.buildsToday,
		pendingReviews: state.changelists.filter((c) =>
			['open', 'blocked', 'changes-requested'].includes(c.status)
		).length,
		pendingKnowledge: state.knowledge.filter((k) => k.status === 'pending').length,
		contractViolations: state.changelists
			.filter((c) => !['merged', 'rejected'].includes(c.status))
			.reduce((n, c) => n + c.contractViolations.length, 0),
		recentMerges: state.kpi.recentMerges,
		changelistsPerDay: state.kpi.changelistsPerDay
	};
	return {
		kpis,
		project: state.project,
		agents: state.agents,
		issues: state.issues,
		blockedCls: state.changelists.filter((c) => c.status === 'blocked')
	};
};
