import { getEngine } from '$lib/server/engine/state';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { state } = await getEngine();
	return { issues: state.issues, agents: state.agents };
};
