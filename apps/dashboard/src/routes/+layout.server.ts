import { env } from '$env/dynamic/private';
import { getEngine } from '$lib/server/engine/state';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const engine = await getEngine();
	const { state } = engine;
	return {
		settings: state.settings,
		storage: engine.storageMode,
		authEnabled: Boolean(env.DASHBOARD_PASSWORD),
		nav: {
			pendingReviews: state.changelists.filter((c) =>
				['open', 'blocked', 'changes-requested'].includes(c.status)
			).length,
			pendingKnowledge: state.knowledge.filter((k) => k.status === 'pending').length,
			awaitingAgents: state.agents.filter((a) => a.status === 'awaiting-approval').length
		}
	};
};
