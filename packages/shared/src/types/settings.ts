/** 환경설정 — 대시보드가 유일한 인터페이스이므로 설치 후 모든 설정은 여기서 관리한다 */

export type ThemeMode = 'dark' | 'light';
export type ThemeAccent = 'gold' | 'jade' | 'azure' | 'ember';

export const THEME_ACCENTS: Record<ThemeAccent, { label: string; color: string }> = {
	gold: { label: '골드', color: '#c8a44e' },
	jade: { label: '비취', color: '#3fbf8f' },
	azure: { label: '청람', color: '#5b9dd9' },
	ember: { label: '주홍', color: '#d97757' }
};

export type LlmProvider = 'claude' | 'openai' | 'custom';

export const LLM_PROVIDERS: Record<LlmProvider, { label: string; defaultModel: string }> = {
	claude: { label: 'Claude (Anthropic)', defaultModel: 'claude-fable-5' },
	openai: { label: 'OpenAI', defaultModel: 'gpt-5' },
	custom: { label: '사내 커스텀 엔드포인트', defaultModel: '' }
};

export interface GiganticSettings {
	/** Perforce 연결 — 하드 디펜던시 */
	p4: {
		port: string;
		user: string;
		depot: string;
	};
	/** 로컬/네트워크 경로 */
	paths: {
		/** UE 엔진 설치 경로 (브릿지 설치 대상) */
		ueEngine: string;
		/** .uproject 경로 */
		ueProject: string;
		/** Shared DDC / 셰이더 캐시 경로 — 워크스페이스 간 공유 */
		sharedDdc: string;
		/** 에이전트 P4 워크스페이스가 생성될 루트 */
		workspaceRoot: string;
	};
	/** 기존 CI — Gigantic은 결과를 읽기만 한다 */
	ci: {
		jenkinsUrl: string;
		jenkinsJob: string;
	};
	/** 에이전트가 사용하는 LLM 백엔드 */
	llm: {
		provider: LlmProvider;
		model: string;
		/** 키는 서버에만 저장 — 클라이언트에는 설정 여부만 노출 */
		apiKeySet: boolean;
	};
	/** 포트 */
	network: {
		dashboardPort: number;
		orchestratorPort: number;
	};
	/** 대시보드 테마 */
	theme: {
		mode: ThemeMode;
		accent: ThemeAccent;
	};
}
