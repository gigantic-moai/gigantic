import { getEngine } from '$lib/server/engine/state';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { state } = getEngine();
	return { posts: state.scrum, agents: state.agents };
};
