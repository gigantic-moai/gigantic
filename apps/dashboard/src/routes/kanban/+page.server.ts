import { getEngine } from '$lib/server/engine/state';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { state } = getEngine();
	return {
		issues: state.issues,
		agents: state.agents,
		changelists: state.changelists.map((c) => ({
			id: c.id,
			number: c.number,
			status: c.status,
			violations: c.contractViolations.length
		}))
	};
};
