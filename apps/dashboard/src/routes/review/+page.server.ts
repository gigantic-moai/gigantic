import { getEngine } from '$lib/server/engine/state';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { state } = await getEngine();
	return {
		changelists: state.changelists,
		agents: state.agents,
		issues: state.issues,
		commentCounts: Object.fromEntries(
			state.changelists.map((cl) => [
				cl.id,
				state.comments.filter((c) => c.changelistId === cl.id).length
			])
		)
	};
};
