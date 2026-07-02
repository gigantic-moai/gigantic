import { error } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { state } = getEngine();
	const changelist = state.changelists.find(
		(c) => c.id === params.id || String(c.number) === params.id
	);
	if (!changelist) error(404, 'changelist를 찾을 수 없습니다');
	return {
		changelist,
		comments: state.comments.filter((c) => c.changelistId === changelist.id),
		agents: state.agents,
		issue: state.issues.find((i) => i.id === changelist.issueId) ?? null
	};
};
