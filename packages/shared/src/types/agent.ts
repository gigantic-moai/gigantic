export type AgentStatus =
  | 'onboarding'
  | 'idle'
  | 'working'
  | 'reviewing'
  | 'watching';

export interface AgentScheduleConfig {
  mode: 'night' | 'day' | 'always-on' | 'manual';
  /** Cron expression or "HH:mm-HH:mm" range. */
  window?: string;
  timezone?: string;
}

export interface AgentKnowledgeSummary {
  patternsLearned: number;
  contractsLearned: number;
  highlights: string[];
}

export interface Agent {
  id: string;
  personaId: string;
  status: AgentStatus;
  scheduleConfig: AgentScheduleConfig;
  knowledgeSummary: AgentKnowledgeSummary | null;
  createdAt: string;
  updatedAt: string;
}
