/**
 * UE 커넥터 — 에디터와의 소켓 통신 계층 (BR-01/02/04/05).
 *
 * 실제 배포에서는 .uplugin(GiganticBridge) 또는 headless sidecar가 UE 에디터
 * 프로세스와 연결된다. 이 구현은 프로토콜을 검증할 수 있는 **mock 에디터**로,
 * 명령에 그럴듯한 지연/결과를 응답하고 UE 스타일 OutputLog를 스트리밍한다.
 */
import type { EditorCommand } from '@gigantic/shared';

export interface MockActor {
	name: string;
	class: string;
	location: [number, number, number];
}

const LOG_TEMPLATES = [
	'LogTemp: GObjectPool acquired PooledProjectile_{n}',
	'LogStreaming: Level streaming update took {ms}ms',
	'LogNet: PushModel dirtied UGAttributeSet::Health',
	'LogBlueprint: Compiled BP_WeaponBase (no issues)',
	'LogShaders: Shared DDC hit rate 99.{n}%',
	'LogGAS: ServerActivateSkill SkillTag=Combat.Skill.Dash ChargeRatio=0.{n}',
	'LogPakFile: Mounted pak //project/main/Content ({ms}ms)',
	'LogWorld: Bringing World /Game/Maps/Arena up for play'
];

function ueTimestamp(date = new Date()): string {
	const p = (v: number, l = 2) => String(v).padStart(l, '0');
	return `[${date.getFullYear()}.${p(date.getMonth() + 1)}.${p(date.getDate())}-${p(date.getHours())}.${p(date.getMinutes())}.${p(date.getSeconds())}:${p(date.getMilliseconds(), 3)}]`;
}

export class MockUeEditor {
	private currentLevel = '/Game/Maps/Arena';
	private pieRunning = false;
	private frame = 0;

	readonly actors: MockActor[] = [
		{ name: 'BP_PlayerCharacter_0', class: 'BP_PlayerCharacter_C', location: [120, -340, 92] },
		{ name: 'BP_WeaponBase_2', class: 'BP_Rifle_C', location: [122, -338, 96] },
		{ name: 'PooledProjectile_17', class: 'AGProjectile', location: [560, -20, 130] },
		{ name: 'DirectionalLight_1', class: 'ADirectionalLight', location: [0, 0, 800] }
	];

	readonly variables: Record<string, unknown> = {
		'GEngine.GameViewport.ViewportSize': '1920x1080',
		'PlayerCombatComponent.ChargeRatio': 0.72,
		'GAttributeSet.Health': 84.5,
		'LODStreamingManager.AllocationQueue.Num': 3
	};

	/** 에디터 명령 실행 — 명령별 소요 시간을 흉내 낸다 */
	async execute(command: EditorCommand, args: Record<string, string> = {}): Promise<unknown> {
		const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
		switch (command) {
			case 'compile-blueprint':
				await delay(600);
				return { blueprint: args.blueprint ?? 'BP_WeaponBase', result: 'compiled', warnings: 0 };
			case 'load-level':
				await delay(900);
				this.currentLevel = args.level ?? this.currentLevel;
				return { level: this.currentLevel, loaded: true };
			case 'start-pie':
				await delay(400);
				this.pieRunning = true;
				return { pie: 'started', level: this.currentLevel };
			case 'stop-pie':
				await delay(200);
				this.pieRunning = false;
				return { pie: 'stopped' };
		}
	}

	queryVariable(name?: string): unknown {
		if (!name) return this.variables;
		return { name, value: this.variables[name] ?? null };
	}

	state() {
		return { level: this.currentLevel, pie: this.pieRunning, actorCount: this.actors.length };
	}

	/** UE OutputLog 형식의 로그 라인 생성 (BR-05) */
	nextLogLine(): string {
		this.frame += 1;
		const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
		const line = template
			.replaceAll('{n}', String(Math.floor(Math.random() * 90) + 10))
			.replaceAll('{ms}', String(Math.floor(Math.random() * 14) + 1));
		return `${ueTimestamp()}[${String(this.frame % 1000).padStart(3, ' ')}]${line}`;
	}
}
