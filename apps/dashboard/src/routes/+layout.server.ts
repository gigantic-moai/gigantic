import { getEngine } from '$lib/server/engine/state';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const { state } = getEngine();
	return {
		settings: state.settings,
		nav: {
			pendingReviews: state.changelists.filter((c) =>
				['open', 'blocked', 'changes-requested'].includes(c.status)
			).length,
			pendingKnowledge: state.knowledge.filter((k) => k.status === 'pending').length,
			awaitingAgents: state.agents.filter((a) => a.status === 'awaiting-approval').length
		}
	};
};
