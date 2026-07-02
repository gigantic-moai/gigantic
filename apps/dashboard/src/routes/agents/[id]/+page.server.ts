import { error } from '@sveltejs/kit';
import { getEngine } from '$lib/server/engine/state';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { state } = await getEngine();
	const agent = state.agents.find((a) => a.id === params.id);
	if (!agent) error(404, '에이전트를 찾을 수 없습니다');
	return {
		agent,
		assignedIssues: state.issues.filter((i) => i.assigneeId === agent.id),
		changelists: state.changelists.filter((c) => c.agentId === agent.id),
		knowledge: state.knowledge.filter((k) => k.sourceAgentId === agent.id),
		scrumCount: state.scrum.filter((p) => p.authorId === agent.id).length
	};
};
