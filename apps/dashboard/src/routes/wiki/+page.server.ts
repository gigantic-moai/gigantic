import { getEngine } from '$lib/server/engine/state';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { state } = getEngine();
	return {
		knowledge: state.knowledge,
		contracts: state.contracts,
		agents: state.agents,
		violations: state.changelists
			.filter((c) => !['merged', 'rejected'].includes(c.status))
			.flatMap((c) =>
				c.contractViolations.map((v) => ({ ...v, changelistId: c.id, changelistNumber: c.number }))
			)
	};
};
