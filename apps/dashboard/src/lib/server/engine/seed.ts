/**
 * 인메모리 mock 엔진 시드 데이터.
 * 브릿지/DB 없이 대시보드 전체 플로우(칸반→리뷰→머지, 온보딩→섬, 스크럼, 위키)를
 * 시연할 수 있는 한국어 콘텐츠.
 */
import type {
	Agent,
	Changelist,
	ContractEntry,
	DiffHunk,
	DiffLine,
	DiffLineType,
	GiganticSettings,
	Issue,
	KnowledgeEntry,
	ReviewComment,
	ScrumPost
} from '@gigantic/shared';

const now = Date.now();
const min = 60_000;
const hour = 60 * min;
const day = 24 * hour;

const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
const dateStr = (offsetDays: number) => {
	const d = new Date(now + offsetDays * day);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const TODAY = dateStr(0);
export const YESTERDAY = dateStr(-1);

/** [타입, 코드] 쌍 배열로 hunk를 만들고 old/new 라인 번호를 자동 계산 */
function hunk(oldStart: number, newStart: number, rows: [DiffLineType, string][]): DiffHunk {
	let oldNo = oldStart;
	let newNo = newStart;
	const lines: DiffLine[] = rows.map(([type, text]) => {
		const line: DiffLine = { type, text };
		if (type !== 'add') line.oldNo = oldNo++;
		if (type !== 'del') line.newNo = newNo++;
		return line;
	});
	const oldCount = lines.filter((l) => l.type !== 'add').length;
	const newCount = lines.filter((l) => l.type !== 'del').length;
	return {
		header: `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`,
		lines
	};
}

/* ─────────────────────────── 에이전트 ─────────────────────────── */

export const seedAgents: Agent[] = [
	{
		id: 'core',
		persona: {
			name: '코어',
			role: 'C++ 엔진 프로그래머',
			personality:
				'엔진 레벨 문제 해결 전문. 메모리 안전성과 퍼포먼스 최우선. 변경 시 항상 프로파일링 결과를 첨부한다. 꼼꼼하고 보수적.',
			tags: ['Core', 'Memory', 'Threading', 'UObject'],
			moai: { stone: 1, faceWidth: 3, eyes: 1, mouth: 4, accessory: 1 }
		},
		status: 'night-work',
		schedule: {
			nightStart: '19:00',
			nightEnd: '09:00',
			trunkWatchMinutes: 30,
			weekdays: [1, 2, 3, 4, 5],
			dayWatchEnabled: true
		},
		onboarding: { step: 7, total: 7, changesetsAnalyzed: 2481 },
		stats: {
			issuesDone: 23,
			changelists: 41,
			trunkFixes: 6,
			knowledge: { pattern: 9, 'asset-mapping': 4, contract: 3, history: 8 }
		},
		currentIssueId: 'i-14',
		progress: 42,
		activity: 'GIG-14 · AsyncLoading 레이스 재현 테스트 작성 중',
		p4Workspace: 'gigantic-ws-core',
		spawnedAt: iso(-53 * day),
		lastHeartbeat: iso(-1 * min)
	},
	{
		id: 'optima',
		persona: {
			name: '옵티마',
			role: '최적화 전문가',
			personality:
				'프레임 드랍을 용납하지 않는 성격. Draw Call 줄이기에 집착한다. 수치로 말하고, 수치로 승부한다.',
			tags: ['Profiling', 'LOD', 'Nanite', 'Lumen'],
			moai: { stone: 2, faceWidth: 1, eyes: 3, mouth: 1, accessory: 4 }
		},
		status: 'night-work',
		schedule: {
			nightStart: '20:00',
			nightEnd: '08:00',
			trunkWatchMinutes: 60,
			weekdays: [1, 2, 3, 4, 5],
			dayWatchEnabled: true
		},
		onboarding: { step: 7, total: 7, changesetsAnalyzed: 1927 },
		stats: {
			issuesDone: 17,
			changelists: 28,
			trunkFixes: 2,
			knowledge: { pattern: 11, 'asset-mapping': 6, contract: 1, history: 5 }
		},
		currentIssueId: 'i-13',
		progress: 18,
		activity: 'GIG-13 · Nanite 폴리지 메모리 프로파일 캡처 중',
		p4Workspace: 'gigantic-ws-optima',
		spawnedAt: iso(-47 * day),
		lastHeartbeat: iso(-2 * min)
	},
	{
		id: 'front',
		persona: {
			name: '프론트',
			role: 'UI/UX 엔지니어',
			personality:
				'Slate & UMG 전문. 디자이너의 의도를 픽셀 단위로 정확히 재현하는 것이 목표. 오래된 위젯 코드에 대한 고고학적 애정이 있다.',
			tags: ['Slate', 'UMG', 'CommonUI', 'Widget'],
			moai: { stone: 3, faceWidth: 2, eyes: 4, mouth: 2, accessory: 3 }
		},
		status: 'night-work',
		schedule: {
			nightStart: '19:00',
			nightEnd: '09:00',
			trunkWatchMinutes: 45,
			weekdays: [1, 2, 3, 4, 5],
			dayWatchEnabled: false
		},
		onboarding: { step: 7, total: 7, changesetsAnalyzed: 1213 },
		stats: {
			issuesDone: 19,
			changelists: 25,
			trunkFixes: 1,
			knowledge: { pattern: 6, 'asset-mapping': 12, contract: 2, history: 6 }
		},
		currentIssueId: 'i-12',
		progress: 67,
		activity: 'GIG-12 · CommonUI 입력 라우팅 마이그레이션 중',
		p4Workspace: 'gigantic-ws-front',
		spawnedAt: iso(-40 * day),
		lastHeartbeat: iso(-40 * 1000)
	},
	{
		id: 'gameplay',
		persona: {
			name: '게임플레이',
			role: '게임플레이 프로그래머',
			personality:
				'GAS 기반 설계에 능숙. 블루프린트 친화적 API를 만드는 것이 자부심. 디자이너가 쓸 수 없는 시스템은 완성이 아니라고 생각한다.',
			tags: ['GAS', 'AI', 'Replication', 'Input'],
			moai: { stone: 0, faceWidth: 4, eyes: 2, mouth: 0, accessory: 0 }
		},
		status: 'night-work',
		schedule: {
			nightStart: '19:00',
			nightEnd: '09:00',
			trunkWatchMinutes: 30,
			weekdays: [1, 2, 3, 4, 5],
			dayWatchEnabled: true
		},
		onboarding: { step: 7, total: 7, changesetsAnalyzed: 1660 },
		stats: {
			issuesDone: 21,
			changelists: 33,
			trunkFixes: 3,
			knowledge: { pattern: 8, 'asset-mapping': 7, contract: 6, history: 4 }
		},
		currentIssueId: 'i-11',
		progress: 88,
		activity: 'GIG-11 · 계약 위반 수정: SkillHUDWidget 호출부 반영 중',
		p4Workspace: 'gigantic-ws-gameplay',
		spawnedAt: iso(-45 * day),
		lastHeartbeat: iso(-30 * 1000)
	},
	{
		id: 'sage',
		persona: {
			name: '세이지',
			role: '테크니컬 아티스트',
			personality:
				'셰이더 그래프보다 HLSL을 좋아한다. 아트팀과 프로그래머 사이의 통역가를 자처하며, 머티리얼 하나에도 근거를 요구한다.',
			tags: ['Shader', 'Material', 'Niagara', 'RenderDoc'],
			moai: { stone: 4, faceWidth: 0, eyes: 5, mouth: 3, accessory: 2 }
		},
		status: 'awaiting-approval',
		schedule: {
			nightStart: '19:00',
			nightEnd: '09:00',
			trunkWatchMinutes: 60,
			weekdays: [1, 2, 3, 4, 5],
			dayWatchEnabled: false
		},
		onboarding: {
			step: 6,
			total: 7,
			startedAt: iso(-3 * hour),
			changesetsAnalyzed: 1842,
			summary: { pattern: 12, 'asset-mapping': 23, contract: 5, history: 17 }
		},
		stats: {
			issuesDone: 0,
			changelists: 0,
			trunkFixes: 0,
			knowledge: { pattern: 0, 'asset-mapping': 0, contract: 0, history: 0 }
		},
		activity: '지식 요약 승인 대기 — 대시보드에서 검토해 주세요',
		p4Workspace: 'gigantic-ws-sage',
		spawnedAt: iso(-3 * hour),
		lastHeartbeat: iso(-10 * 1000)
	}
];

/* ─────────────────────────── 환경설정 ─────────────────────────── */

export const seedSettings: GiganticSettings = {
	p4: {
		port: 'ssl:perforce.company.com:1666',
		user: 'gigantic-agent',
		depot: '//project/main/...',
		passwordSet: true
	},
	paths: {
		ueEngine: 'C:\\Program Files\\Epic Games\\UE_5.6',
		ueProject: 'D:\\p4\\project\\main\\Game.uproject',
		sharedDdc: '\\\\nas\\SharedDDC',
		workspaceRoot: 'D:\\gigantic\\workspaces'
	},
	ci: {
		jenkinsUrl: 'https://jenkins.company.local',
		jenkinsJob: 'game-main-win64'
	},
	llm: {
		provider: 'claude',
		model: 'claude-fable-5',
		apiKeySet: true
	},
	network: {
		dashboardPort: 3000,
		orchestratorPort: 4000
	},
	workflow: {
		mergePolicy: 'finish-order',
		onboardingMonths: 0 // 전체 히스토리
	},
	theme: {
		mode: 'dark',
		accent: 'gold'
	}
};

/* ─────────────────────────── 프로젝트 (설치 시 전체 서밋 분석) ─────────────────────────── */

/**
 * 🏝️ 섬은 프로젝트의 것 — Gigantic 설치 시 depot의 전체 서밋을 둘러보며
 * 지식을 축적했고, 축적이 완료되며 섬이 생성됐다. 지식이 승인될 때마다 성장한다.
 */
export const seedProject = {
	installedAt: iso(-60 * day),
	changesetsAnalyzed: 12847,
	knowledge: { pattern: 34, 'asset-mapping': 52, contract: 12, history: 41 } as Record<
		'pattern' | 'asset-mapping' | 'contract' | 'history',
		number
	>
};

/* ─────────────────────────── 이슈 (칸반/워터폴) ─────────────────────────── */

export const seedIssues: Issue[] = [
	{
		id: 'i-1',
		key: 'GIG-1',
		title: '인벤토리 UI 리팩토링',
		description: '레거시 Slate 인벤토리를 UMG + ViewModel 구조로 이전.',
		tags: ['UMG', 'Widget'],
		assigneeId: 'front',
		status: 'done',
		priority: 'p1',
		deps: [],
		expectedFiles: ['Source/ProjectG/UI/InventoryWidget.cpp'],
		uassets: ['Content/UI/WBP_Inventory.uasset'],
		createdAt: iso(-21 * day),
		updatedAt: iso(-14 * day)
	},
	{
		id: 'i-2',
		key: 'GIG-2',
		title: '레벨 전환 시 GC 스파이크 수정',
		description: '레벨 스트리밍 중 60ms GC 스파이크 발생. 증분 GC 파라미터 튜닝 및 UObject 정리.',
		tags: ['Core', 'Memory'],
		assigneeId: 'core',
		status: 'done',
		priority: 'p0',
		deps: [],
		expectedFiles: ['Source/ProjectG/Core/GGameInstance.cpp'],
		uassets: [],
		createdAt: iso(-18 * day),
		updatedAt: iso(-11 * day)
	},
	{
		id: 'i-4',
		key: 'GIG-4',
		title: '나이아가라 히트 이펙트 풀링',
		description: '히트 이펙트 스폰 비용 절감을 위한 나이아가라 컴포넌트 풀링.',
		tags: ['Profiling', 'Niagara'],
		assigneeId: 'optima',
		status: 'done',
		priority: 'p1',
		deps: [],
		expectedFiles: ['Source/ProjectG/VFX/HitFxPool.cpp'],
		uassets: ['Content/VFX/NS_HitSpark.uasset'],
		createdAt: iso(-15 * day),
		updatedAt: iso(-8 * day)
	},
	{
		id: 'i-5',
		key: 'GIG-5',
		title: '무기 장착 슬롯 UMG 위젯',
		description: '디자이너 시안 기준 무기 장착 슬롯 위젯 구현. 드래그앤드롭 지원.',
		tags: ['UMG', 'CommonUI'],
		assigneeId: 'front',
		status: 'done',
		priority: 'p1',
		deps: ['i-1'],
		expectedFiles: ['Source/ProjectG/UI/WeaponSlotWidget.cpp'],
		uassets: ['Content/UI/WBP_WeaponSlot.uasset'],
		changelistId: 'cl-1041',
		createdAt: iso(-12 * day),
		updatedAt: iso(-1 * day)
	},
	{
		id: 'i-7',
		key: 'GIG-7',
		title: '범용 액터 오브젝트 풀 도입',
		description:
			'투사체/이펙트 액터 스폰 비용 절감을 위한 범용 오브젝트 풀. 레벨 전환 시 풀 정리 포함.',
		tags: ['Core', 'Memory', 'Profiling'],
		assigneeId: 'core',
		status: 'review',
		priority: 'p0',
		deps: ['i-2'],
		expectedFiles: [
			'Source/ProjectG/Core/GObjectPool.h',
			'Source/ProjectG/Core/GObjectPool.cpp'
		],
		uassets: [],
		changelistId: 'cl-1042',
		createdAt: iso(-9 * day),
		updatedAt: iso(-9 * hour)
	},
	{
		id: 'i-9',
		key: 'GIG-9',
		title: 'LOD 스트리밍 allocation spike 제거',
		description:
			'레벨 스트리밍 시 LOD 메시 할당이 한 프레임에 몰려 스파이크 발생. 분산 할당 + 풀 활용.',
		tags: ['LOD', 'Profiling', 'Memory'],
		assigneeId: 'optima',
		status: 'review',
		priority: 'p0',
		deps: ['i-7'],
		expectedFiles: ['Source/ProjectG/Streaming/LODStreamingManager.cpp'],
		uassets: [],
		changelistId: 'cl-1043',
		createdAt: iso(-8 * day),
		updatedAt: iso(-8 * hour)
	},
	{
		id: 'i-11',
		key: 'GIG-11',
		title: '스킬 사용 서버 RPC에 차지 비율 추가',
		description:
			'차지형 스킬 지원을 위해 ServerActivateSkill RPC에 ChargeRatio 파라미터 추가. GAS 어빌리티에 전달.',
		tags: ['GAS', 'Replication'],
		assigneeId: 'gameplay',
		status: 'review',
		priority: 'p1',
		deps: [],
		expectedFiles: ['Source/ProjectG/Combat/PlayerCombatComponent.h'],
		uassets: [],
		changelistId: 'cl-1044',
		createdAt: iso(-6 * day),
		updatedAt: iso(-7 * hour)
	},
	{
		id: 'i-15',
		key: 'GIG-15',
		title: '[트렁크] GBloom.usf 셰이더 컴파일 에러 수정',
		description:
			'주간 트렁크 감시가 젠킨스 빌드 실패를 감지. 어제 커밋된 사람 CL 1039의 float3/float4 타입 불일치 수정.',
		tags: ['Shader', 'Core'],
		assigneeId: 'core',
		status: 'review',
		priority: 'p0',
		deps: [],
		expectedFiles: ['Shaders/PostProcess/GBloom.usf'],
		uassets: [],
		changelistId: 'cl-1045',
		trunkFix: true,
		createdAt: iso(-26 * hour),
		updatedAt: iso(-24 * hour)
	},
	{
		id: 'i-12',
		key: 'GIG-12',
		title: '장비창 CommonUI 마이그레이션',
		description: '장비창 위젯 스택을 CommonUI ActivatableWidget 기반으로 이전. 게임패드 입력 라우팅 포함.',
		tags: ['CommonUI', 'UMG', 'Input'],
		assigneeId: 'front',
		status: 'in-progress',
		priority: 'p1',
		deps: ['i-5'],
		expectedFiles: ['Source/ProjectG/UI/EquipmentScreen.cpp'],
		uassets: ['Content/UI/WBP_EquipmentScreen.uasset'],
		createdAt: iso(-5 * day),
		updatedAt: iso(-2 * hour)
	},
	{
		id: 'i-13',
		key: 'GIG-13',
		title: 'Nanite 폴리지 메모리 예산 초과 조사',
		description: '야외 맵에서 Nanite 스트리밍 풀 예산 초과. 폴리지 에셋별 메모리 기여도 분석 후 조정.',
		tags: ['Nanite', 'Profiling'],
		assigneeId: 'optima',
		status: 'in-progress',
		priority: 'p1',
		deps: ['i-9'],
		expectedFiles: ['Config/DefaultEngine.ini'],
		uassets: ['Content/Env/Foliage/SM_Pine_Nanite.uasset'],
		createdAt: iso(-4 * day),
		updatedAt: iso(-1 * hour)
	},
	{
		id: 'i-14',
		key: 'GIG-14',
		title: 'UObject 비동기 로딩 레이스 컨디션 수정',
		description:
			'AsyncLoadingThread와 게임 스레드 간 FSoftObjectPath 해석 레이스. 재현 테스트 작성 후 수정.',
		tags: ['Core', 'Threading', 'UObject'],
		assigneeId: 'core',
		status: 'in-progress',
		priority: 'p0',
		deps: [],
		expectedFiles: ['Source/ProjectG/Core/GAssetManager.cpp'],
		uassets: [],
		createdAt: iso(-3 * day),
		updatedAt: iso(-30 * min)
	},
	{
		id: 'i-6',
		key: 'GIG-6',
		title: 'BP_WeaponBase 상속 구조 리팩토링',
		description:
			'무기 블루프린트 5단 상속을 컴포넌트 조합 구조로 평탄화. 배타적 잠금 필요(.uasset).',
		tags: ['GAS', 'Core'],
		assigneeId: 'gameplay',
		status: 'todo',
		priority: 'p1',
		deps: [],
		expectedFiles: ['Source/ProjectG/Weapons/WeaponBase.cpp'],
		uassets: ['Content/Weapons/BP_WeaponBase.uasset'],
		createdAt: iso(-3 * day),
		updatedAt: iso(-3 * day)
	},
	{
		id: 'i-3',
		key: 'GIG-3',
		title: '무기 밸런스 데이터테이블 개편',
		description:
			'DT_DamageTable 스키마에 크리티컬 배율 컬럼 추가. BP_WeaponBase 리팩토링(GIG-6) 이후 진행.',
		tags: ['GAS'],
		status: 'todo',
		priority: 'p2',
		deps: ['i-6'],
		expectedFiles: ['Source/ProjectG/Combat/DamageTableRow.h'],
		uassets: ['Content/Weapons/BP_WeaponBase.uasset', 'Content/Data/DT_DamageTable.uasset'],
		createdAt: iso(-3 * day),
		updatedAt: iso(-3 * day)
	},
	{
		id: 'i-8',
		key: 'GIG-8',
		title: 'GAS 어트리뷰트 세트 정리',
		description: '중복 어트리뷰트(Stamina/Endurance) 통합 및 PushModel 복제 적용.',
		tags: ['GAS', 'Replication'],
		assigneeId: 'gameplay',
		status: 'todo',
		priority: 'p1',
		deps: [],
		expectedFiles: ['Source/ProjectG/Combat/GAttributeSet.h'],
		uassets: [],
		createdAt: iso(-2 * day),
		updatedAt: iso(-2 * day)
	},
	{
		id: 'i-10',
		key: 'GIG-10',
		title: '대미지 파이프라인 통합 리그레션 테스트',
		description:
			'GameplayEffectExecutionCalculation 경로 전체를 커버하는 자동화 테스트. GIG-8, GIG-11 완료 후.',
		tags: ['GAS', 'Core'],
		status: 'todo',
		priority: 'p1',
		deps: ['i-8', 'i-11'],
		expectedFiles: ['Source/ProjectG/Tests/DamagePipelineTest.cpp'],
		uassets: ['Content/Data/DT_DamageTable.uasset'],
		createdAt: iso(-2 * day),
		updatedAt: iso(-2 * day)
	},
	{
		id: 'i-16',
		key: 'GIG-16',
		title: '매치 결과 화면 리뉴얼',
		description: '매치 결과 화면을 신규 디자인 시안으로 리뉴얼. 장비창 마이그레이션(GIG-12) 이후.',
		tags: ['UMG', 'CommonUI'],
		status: 'todo',
		priority: 'p2',
		deps: ['i-12'],
		expectedFiles: ['Source/ProjectG/UI/MatchResultScreen.cpp'],
		uassets: ['Content/UI/WBP_MatchResult.uasset'],
		createdAt: iso(-1 * day),
		updatedAt: iso(-1 * day)
	}
];

/* ─────────────────────────── P4 Changelists ─────────────────────────── */

export const seedChangelists: Changelist[] = [
	{
		id: 'cl-1042',
		number: 1042,
		agentId: 'core',
		issueId: 'i-7',
		title: 'GIG-7: 범용 액터 오브젝트 풀 도입',
		description:
			'[GIG-7] 투사체/이펙트 스폰 비용 절감용 범용 오브젝트 풀.\n\n- FGObjectPool: 클래스별 풀, 프리워밍 API 포함\n- 레벨 전환 시 PoolSubsystem이 풀 정리\n- 스폰 경로 프로파일링: 평균 0.82ms → 0.11ms (1000 액터 기준)',
		agentLog: [
			'21:14 이슈 분석 — 변경 예상 파일 2개, .uasset 충돌 없음',
			'21:15 P4 워크스페이스 gigantic-ws-core 뷰 매핑 갱신 (Source/ProjectG/Core/...)',
			'21:31 GObjectPool.h/.cpp 작성, PoolSubsystem에 레벨 전환 훅 연결',
			'22:47 유닛 테스트 12건 통과, 스폰 벤치마크 0.82ms → 0.11ms',
			'23:02 빌드 성공 (Win64 Development) — CL 1042 서밋, 리뷰 요청 등록'
		],
		status: 'open',
		buildStatus: 'success',
		contractViolations: [],
		createdAt: iso(-9 * hour),
		files: [
			{
				path: 'Source/ProjectG/Core/GObjectPool.h',
				action: 'add',
				hunks: [
					hunk(0, 1, [
						['add', '#pragma once'],
						['add', ''],
						['add', '#include "CoreMinimal.h"'],
						['add', '#include "GObjectPool.generated.h"'],
						['add', ''],
						['add', '/** 클래스별 액터 풀. 레벨 전환 시 PoolSubsystem이 정리한다. */'],
						['add', 'USTRUCT()'],
						['add', 'struct FGObjectPool'],
						['add', '{'],
						['add', '\tGENERATED_BODY()'],
						['add', ''],
						['add', '\t/** 풀에서 액터를 꺼낸다. 비어 있으면 스폰. */'],
						['add', '\tAActor* Acquire(UWorld& World, TSubclassOf<AActor> Class);'],
						['add', ''],
						['add', '\t/** 액터를 풀로 반납한다. Hidden + TickDisabled 상태가 된다. */'],
						['add', '\tvoid Release(AActor* Actor);'],
						['add', ''],
						['add', '\t/** 프리워밍: Count만큼 미리 스폰해 풀에 넣어둔다. */'],
						['add', '\tvoid Prewarm(UWorld& World, TSubclassOf<AActor> Class, int32 Count);'],
						['add', ''],
						['add', 'private:'],
						['add', '\tUPROPERTY()'],
						['add', '\tTArray<TObjectPtr<AActor>> FreeList;'],
						['add', ''],
						['add', '\t/** 풀 상한. 초과 반납은 그냥 Destroy. */'],
						['add', '\tint32 MaxSize = 256;'],
						['add', '};']
					])
				]
			},
			{
				path: 'Source/ProjectG/Core/GObjectPool.cpp',
				action: 'add',
				hunks: [
					hunk(0, 1, [
						['add', '#include "GObjectPool.h"'],
						['add', ''],
						['add', 'AActor* FGObjectPool::Acquire(UWorld& World, TSubclassOf<AActor> Class)'],
						['add', '{'],
						['add', '\twhile (FreeList.Num() > 0)'],
						['add', '\t{'],
						['add', '\t\tAActor* Pooled = FreeList.Pop(EAllowShrinking::No);'],
						['add', '\t\tif (IsValid(Pooled))'],
						['add', '\t\t{'],
						['add', '\t\t\tPooled->SetActorHiddenInGame(false);'],
						['add', '\t\t\tPooled->SetActorEnableCollision(true);'],
						['add', '\t\t\tPooled->SetActorTickEnabled(true);'],
						['add', '\t\t\treturn Pooled;'],
						['add', '\t\t}'],
						['add', '\t}'],
						['add', '\tFActorSpawnParameters Params;'],
						['add', '\tParams.SpawnCollisionHandlingOverride ='],
						['add', '\t\tESpawnActorCollisionHandlingMethod::AlwaysSpawn;'],
						['add', '\treturn World.SpawnActor<AActor>(Class, Params);'],
						['add', '}'],
						['add', ''],
						['add', 'void FGObjectPool::Release(AActor* Actor)'],
						['add', '{'],
						['add', '\tif (!IsValid(Actor) || FreeList.Num() >= MaxSize)'],
						['add', '\t{'],
						['add', '\t\tif (IsValid(Actor)) Actor->Destroy();'],
						['add', '\t\treturn;'],
						['add', '\t}'],
						['add', '\tActor->SetActorHiddenInGame(true);'],
						['add', '\tActor->SetActorEnableCollision(false);'],
						['add', '\tActor->SetActorTickEnabled(false);'],
						['add', '\tFreeList.Push(Actor);'],
						['add', '}']
					])
				]
			},
			{
				path: 'Source/ProjectG/ProjectG.Build.cs',
				action: 'edit',
				hunks: [
					hunk(18, 18, [
						['ctx', '\t\tPublicDependencyModuleNames.AddRange(new string[] {'],
						['ctx', '\t\t\t"Core", "CoreUObject", "Engine", "InputCore",'],
						['del', '\t\t\t"GameplayAbilities", "GameplayTags"'],
						['add', '\t\t\t"GameplayAbilities", "GameplayTags", "DeveloperSettings"'],
						['ctx', '\t\t});']
					])
				]
			}
		]
	},
	{
		id: 'cl-1043',
		number: 1043,
		agentId: 'optima',
		issueId: 'i-9',
		title: 'GIG-9: LOD 스트리밍 allocation spike 제거',
		description:
			'[GIG-9] 레벨 스트리밍 시 LOD 메시 할당을 프레임 분산 처리.\n\n- 한 프레임 최대 8개 메시로 할당 분산\n- 코어의 오브젝트 풀(CL 1042)에서 LOD 메시 컴포넌트 선점\n- Insights 캡처: 스트리밍 프레임 spike 11.2ms → 2.9ms',
		agentLog: [
			'22:03 이슈 분석 — GIG-7 풀링 CL 1042와 시너지 확인, 의존 이슈 완료 대기 없이 병행 가능 판단',
			'22:05 Shared DDC 연결 — 셰이더 캐시 히트율 99.2%',
			'23:18 LODStreamingManager 분산 할당 구현',
			'00:41 Insights 캡처 첨부: spike 11.2ms → 2.9ms',
			'00:55 빌드 성공 — CL 1043 서밋, 리뷰 요청 등록'
		],
		status: 'open',
		buildStatus: 'success',
		contractViolations: [],
		createdAt: iso(-8 * hour),
		files: [
			{
				path: 'Source/ProjectG/Streaming/LODStreamingManager.cpp',
				action: 'edit',
				hunks: [
					hunk(84, 84, [
						['ctx', 'void FLODStreamingManager::OnLevelStreamed(ULevel* Level)'],
						['ctx', '{'],
						['del', '\t// 레벨 내 모든 LOD 메시를 즉시 할당 — 프레임 스파이크의 원인'],
						['del', '\tfor (UStaticMeshComponent* Mesh : PendingMeshes)'],
						['del', '\t{'],
						['del', '\t\tAllocateLODResources(Mesh);'],
						['del', '\t}'],
						['del', '\tPendingMeshes.Empty();'],
						['add', '\t// 할당을 프레임에 분산한다. 남은 것은 Tick에서 이어서 처리.'],
						['add', '\tAllocationQueue.Append(PendingMeshes);'],
						['add', '\tPendingMeshes.Empty();'],
						['add', '\tDrainAllocationQueue(MaxAllocationsPerFrame);'],
						['ctx', '}'],
						['ctx', '']
					]),
					hunk(112, 110, [
						['ctx', 'void FLODStreamingManager::Tick(float DeltaTime)'],
						['ctx', '{'],
						['del', '\tUpdateVisibleLODs();'],
						['add', '\tUpdateVisibleLODs();'],
						['add', ''],
						['add', '\tif (!AllocationQueue.IsEmpty())'],
						['add', '\t{'],
						['add', '\t\t// GIG-7 오브젝트 풀에서 컴포넌트를 선점해 allocation spike 제거'],
						['add', '\t\tDrainAllocationQueue(MaxAllocationsPerFrame);'],
						['add', '\t}'],
						['ctx', '}']
					])
				]
			}
		]
	},
	{
		id: 'cl-1044',
		number: 1044,
		agentId: 'gameplay',
		issueId: 'i-11',
		title: 'GIG-11: ServerActivateSkill RPC에 ChargeRatio 추가',
		description:
			'[GIG-11] 차지형 스킬 지원.\n\n- ServerActivateSkill(FGameplayTag) → (FGameplayTag, float ChargeRatio)\n- GAS 어빌리티에 ChargeRatio를 SetByCaller로 전달\n\n⚠ 계약 레지스트리가 클라 호출부 미반영을 감지해 머지가 차단된 상태.',
		agentLog: [
			'20:12 이슈 분석 — PlayerCombatComponent.h 시그니처 변경 필요',
			'20:40 RPC 파라미터 추가, SetByCaller 연결',
			'21:55 빌드 성공 — CL 1044 서밋',
			'21:56 ⚠ 계약 위반 감지: client-dedi/ServerActivateSkill — 호출부 SkillHUDWidget.cpp 미반영, 머지 차단',
			'21:57 후속 작업 등록: 오늘 밤 SkillHUDWidget 호출부 및 BP_PlayerHUD 함께 수정 예정'
		],
		status: 'blocked',
		buildStatus: 'success',
		contractViolations: [
			{
				contractId: 'c-rpc-activateskill',
				contractName: 'ServerActivateSkill RPC',
				boundary: 'client-dedi',
				severity: 'block',
				message:
					'UFUNCTION(Server) ServerActivateSkill의 파라미터가 변경되었지만, 등록된 클라 호출부 2곳(SkillHUDWidget.cpp, BP_PlayerHUD.uasset)이 이 CL에 포함되지 않았습니다.',
				suggestion:
					'같은 changelist에서 호출부를 함께 수정하거나, 호출부 수정 CL과 원자적으로 머지하세요.'
			}
		],
		createdAt: iso(-7 * hour),
		files: [
			{
				path: 'Source/ProjectG/Combat/PlayerCombatComponent.h',
				action: 'edit',
				hunks: [
					hunk(41, 41, [
						['ctx', '\t/** 스킬 발동 요청 — 데디서버 권위 검증 후 GAS 어빌리티 실행 */'],
						['del', '\tUFUNCTION(Server, Reliable, WithValidation)'],
						['del', '\tvoid ServerActivateSkill(FGameplayTag SkillTag);'],
						['add', '\tUFUNCTION(Server, Reliable, WithValidation)'],
						['add', '\tvoid ServerActivateSkill(FGameplayTag SkillTag, float ChargeRatio);'],
						['ctx', ''],
						['ctx', '\tUFUNCTION(BlueprintCallable, Category = "Combat")'],
						['del', '\tvoid RequestSkill(FGameplayTag SkillTag);'],
						['add', '\tvoid RequestSkill(FGameplayTag SkillTag, float ChargeRatio = 1.f);']
					])
				]
			},
			{
				path: 'Source/ProjectG/Combat/PlayerCombatComponent.cpp',
				action: 'edit',
				hunks: [
					hunk(96, 96, [
						['del', 'void UPlayerCombatComponent::ServerActivateSkill_Implementation(FGameplayTag SkillTag)'],
						['add', 'void UPlayerCombatComponent::ServerActivateSkill_Implementation('],
						['add', '\tFGameplayTag SkillTag, float ChargeRatio)'],
						['ctx', '{'],
						['del', '\tActivateSkillInternal(SkillTag);'],
						['add', '\tconst float Clamped = FMath::Clamp(ChargeRatio, 0.f, 1.f);'],
						['add', '\tActivateSkillInternal(SkillTag, Clamped);'],
						['ctx', '}']
					])
				]
			}
		]
	},
	{
		id: 'cl-1045',
		number: 1045,
		agentId: 'core',
		issueId: 'i-15',
		title: '[트렁크 수정] GBloom.usf float3/float4 타입 불일치',
		description:
			'[GIG-15][트렁크 수정] ☀️ 주간 감시 중 젠킨스 #4182 실패 감지.\n\n- 원인: CL 1039(사람 커밋)에서 SceneColor 샘플을 float3로 받으나 반환은 float4\n- 수정: 알파 보존하도록 float4로 통일',
		agentLog: [
			'14:31 주기 감시 — 젠킨스 #4182 FAILED 감지 (ShaderCompileWorker)',
			'14:32 원인 분석 — CL 1039 GBloom.usf float3/float4 불일치',
			'14:36 수정 changelist 생성, 로컬 셰이더 컴파일 통과',
			'14:40 CL 1045 서밋 — "트렁크 수정" 태그로 리뷰 요청'
		],
		status: 'open',
		buildStatus: 'success',
		contractViolations: [],
		trunkFix: true,
		createdAt: iso(-30 * hour),
		files: [
			{
				path: 'Shaders/PostProcess/GBloom.usf',
				action: 'edit',
				hunks: [
					hunk(52, 52, [
						['ctx', 'float4 BloomDownsamplePS(FScreenVertexOutput Input) : SV_Target0'],
						['ctx', '{'],
						['del', '\tfloat3 SceneColor = Texture2DSample(InputTexture, InputSampler, Input.UV);'],
						['del', '\treturn SceneColor * BloomTint;'],
						['add', '\t// CL 1039 회귀: 샘플은 float4다. 알파를 보존해야 컴포짓 단계가 깨지지 않는다.'],
						['add', '\tfloat4 SceneColor = Texture2DSample(InputTexture, InputSampler, Input.UV);'],
						['add', '\treturn float4(SceneColor.rgb * BloomTint.rgb, SceneColor.a);'],
						['ctx', '}']
					])
				]
			}
		]
	},
	{
		id: 'cl-1041',
		number: 1041,
		agentId: 'front',
		issueId: 'i-5',
		title: 'GIG-5: 무기 장착 슬롯 UMG 위젯',
		description:
			'[GIG-5] 무기 장착 슬롯 위젯.\n\n- WeaponSlotWidget C++ 베이스 + WBP_WeaponSlot\n- 드래그앤드롭, 게임패드 포커스 지원\n- 디자이너 시안 대비 1px 단위 검수 완료',
		agentLog: [
			'19:22 이슈 분석 — WBP_WeaponSlot.uasset 배타적 잠금 획득',
			'20:10 WeaponSlotWidget 구현, CommonUI 포커스 연결',
			'21:30 빌드 성공 — CL 1041 서밋, 리뷰 요청 등록'
		],
		status: 'merged',
		buildStatus: 'success',
		contractViolations: [],
		createdAt: iso(-1 * day - 10 * hour),
		files: [
			{
				path: 'Source/ProjectG/UI/WeaponSlotWidget.h',
				action: 'add',
				hunks: [
					hunk(0, 1, [
						['add', '#pragma once'],
						['add', ''],
						['add', '#include "CommonUserWidget.h"'],
						['add', '#include "WeaponSlotWidget.generated.h"'],
						['add', ''],
						['add', 'UCLASS(Abstract)'],
						['add', 'class UWeaponSlotWidget : public UCommonUserWidget'],
						['add', '{'],
						['add', '\tGENERATED_BODY()'],
						['add', ''],
						['add', 'public:'],
						['add', '\tUFUNCTION(BlueprintCallable, Category = "Equipment")'],
						['add', '\tvoid SetWeapon(const FWeaponSlotData& InData);'],
						['add', '};']
					])
				]
			},
			{
				path: 'Content/UI/WBP_WeaponSlot.uasset',
				action: 'add',
				binary: true,
				hunks: []
			}
		]
	}
];

/* ─────────────────────────── 리뷰 코멘트 ─────────────────────────── */

export const seedComments: ReviewComment[] = [
	{
		id: 'rc-1',
		changelistId: 'cl-1042',
		filePath: 'Source/ProjectG/Core/GObjectPool.h',
		line: 26,
		lineType: 'add',
		authorType: 'human',
		authorName: 'PO',
		body: '풀 상한 256의 근거가 있나요? 투사체 많은 맵에서는 부족할 것 같은데.',
		createdAt: iso(-5 * hour)
	},
	{
		id: 'rc-2',
		changelistId: 'cl-1042',
		filePath: 'Source/ProjectG/Core/GObjectPool.h',
		line: 26,
		lineType: 'add',
		authorType: 'agent',
		authorId: 'core',
		authorName: '코어',
		parentId: 'rc-1',
		body: '변경 근거: 최근 30일 플레이 세션 프로파일에서 동시 풀 사용량 p99가 187이었습니다. 256은 p99 + 여유분이고, 초과분은 Destroy로 흘려보내 메모리 상한을 보장합니다. 맵별 튜닝이 필요하면 DeveloperSettings로 노출하겠습니다.',
		createdAt: iso(-4 * hour - 40 * min)
	},
	{
		id: 'rc-3',
		changelistId: 'cl-1042',
		filePath: 'Source/ProjectG/Core/GObjectPool.cpp',
		line: 7,
		lineType: 'add',
		authorType: 'human',
		authorName: 'PO',
		body: 'Pop 할 때 IsValid 체크가 있는 건 좋네요. GC로 사라진 액터 케이스 커버.',
		createdAt: iso(-4 * hour)
	},
	{
		id: 'rc-4',
		changelistId: 'cl-1044',
		authorType: 'agent',
		authorId: 'gameplay',
		authorName: '게임플레이',
		body: '변경 근거: 차지형 스킬(GDD 4.2)이 서버 권위 검증을 통과하려면 차지 비율이 RPC에 실려야 합니다. 계약 위반은 인지하고 있고, SkillHUDWidget 호출부 수정을 오늘 밤 같은 CL로 합칠 예정입니다.',
		createdAt: iso(-6 * hour)
	}
];

/* ─────────────────────────── 지식 베이스 ─────────────────────────── */

export const seedKnowledge: KnowledgeEntry[] = [
	{
		id: 'k-1',
		category: 'pattern',
		title: '대미지 계산은 항상 GameplayEffectExecutionCalculation을 통한다',
		body: '직접 어트리뷰트를 깎는 코드는 금지. 모든 대미지는 UGDamageExecCalc를 경유해 방어력/버프/크리티컬을 일괄 처리한다. 예외를 만들면 리그레션 테스트(GIG-10)가 잡는다.\n\n근거 changeset: 812, 887, 951 — 세 번의 리팩토링에서 반복 확인된 패턴.',
		tags: ['GAS', 'Combat'],
		status: 'approved',
		sourceChangelist: 951,
		createdAt: iso(-40 * day),
		updatedAt: iso(-12 * day)
	},
	{
		id: 'k-2',
		category: 'pattern',
		title: '네트워크 복제는 PushModel 패턴',
		body: 'DOREPLIFETIME 대신 DOREPLIFETIME_WITH_PARAMS + MARK_PROPERTY_DIRTY 사용. 복제 비용을 상태 변경 시점으로 옮긴다. 새 복제 프로퍼티 추가 시 반드시 PushModel로.',
		tags: ['Replication', 'Core'],
		status: 'approved',
		sourceChangelist: 903,
		createdAt: iso(-35 * day),
		updatedAt: iso(-35 * day)
	},
	{
		id: 'k-3',
		category: 'asset-mapping',
		title: 'BP_WeaponBase.uasset → 무기 시스템',
		body: '"무기 시스템 수정" 명령의 진입점. 파생 BP 5종(BP_Rifle, BP_Shotgun, BP_Blade, BP_Bow, BP_Launcher)이 상속. 수정 시 배타적 잠금 필수, 파생 BP 재저장 여부 확인.',
		tags: ['Weapons'],
		status: 'approved',
		createdAt: iso(-38 * day),
		updatedAt: iso(-20 * day)
	},
	{
		id: 'k-4',
		category: 'asset-mapping',
		title: 'DT_DamageTable.uasset → 대미지 파이프라인',
		body: '대미지 파이프라인의 밸런스 데이터 원장. 컬럼 스키마는 FDamageTableRow(Source/ProjectG/Combat/DamageTableRow.h)와 1:1. 스키마 변경 시 헤더와 테이블을 같은 CL로 묶을 것.',
		tags: ['Combat', 'Data'],
		status: 'approved',
		createdAt: iso(-38 * day),
		updatedAt: iso(-16 * day)
	},
	{
		id: 'k-5',
		category: 'contract',
		title: 'S_EnterMatch — 데디서버 매치 입장 계약',
		body: '클라 → 데디서버 입장 핸드셰이크. FEnterMatchRequest{MatchTicket, BuildVersion} / FEnterMatchAck{Slot, ServerTick}. BuildVersion 불일치 시 데디가 즉시 킥. 티켓 포맷은 백엔드 매치메이커와 공유되므로 임의 변경 금지.',
		tags: ['Dedi', 'Matchmaking'],
		status: 'approved',
		createdAt: iso(-33 * day),
		updatedAt: iso(-33 * day)
	},
	{
		id: 'k-6',
		category: 'history',
		title: 'PlayerCombatComponent.cpp — 변경 핫스팟 (6개월 14회)',
		body: '최근 6개월 14회 수정. 주 작성자: 게임플레이(9회), 사람 개발자 김현우(4회). 마지막 변경 이유: 스킬 판정 성능 이슈(CL 1011). 회귀 위험 높음 — 수정 시 대미지 파이프라인 테스트 필수.',
		tags: ['Combat', 'Hotspot'],
		status: 'approved',
		createdAt: iso(-10 * day),
		updatedAt: iso(-2 * day)
	},
	{
		id: 'k-7',
		category: 'pattern',
		title: 'LOD 메시 컴포넌트는 오브젝트 풀에서 선점',
		body: '레벨 스트리밍 직전 FGObjectPool::Prewarm으로 LOD 메시 컴포넌트를 미리 잡아두면 스트리밍 프레임의 allocation spike가 사라진다(11.2ms → 2.9ms, CL 1043). 스트리밍이 잦은 야외 맵에 적용 권장.',
		tags: ['LOD', 'Memory', 'Streaming'],
		status: 'pending',
		sourceAgentId: 'optima',
		sourceChangelist: 1043,
		createdAt: iso(-7 * hour),
		updatedAt: iso(-7 * hour)
	},
	{
		id: 'k-8',
		category: 'history',
		title: 'SOverlay 3겹 중첩 (InventoryPanel.cpp) — 의도 불명, 보존 중',
		body: '5년 전 CL 288에서 SOverlay 안에 SOverlay를 세 겹으로 쌓은 구조 발견. 코멘트 없음, 작성자 퇴사. 렌더링 순서 workaround로 추정되나 확증 없음 — 제거 실험은 별도 이슈로 진행할 것. 일단 보존.',
		tags: ['Slate', 'Legacy'],
		status: 'pending',
		sourceAgentId: 'front',
		sourceChangelist: 1040,
		createdAt: iso(-26 * hour),
		updatedAt: iso(-26 * hour)
	},
	{
		id: 'k-9',
		category: 'asset-mapping',
		title: 'NS_HitSpark.uasset → 전투 피드백 시스템',
		body: '히트 이펙트의 루트 나이아가라 시스템. HitFxPool이 풀링하므로 파라미터 추가 시 풀 리셋 로직(ResetPooledInstance) 갱신 필요.',
		tags: ['VFX', 'Combat'],
		status: 'pending',
		sourceAgentId: 'optima',
		sourceChangelist: 1038,
		createdAt: iso(-3 * day),
		updatedAt: iso(-3 * day)
	},
	{
		id: 'k-10',
		category: 'pattern',
		title: 'Tick에서 에셋 지연 로딩',
		body: 'BossArena 레벨에서 Tick 중 FSoftObjectPath.TryLoad 호출 패턴 발견 — 1회성 핫픽스(CL 1019)로 판정. 패턴으로 승격하지 않음.',
		tags: ['Loading'],
		status: 'rejected',
		sourceAgentId: 'core',
		sourceChangelist: 1019,
		createdAt: iso(-6 * day),
		updatedAt: iso(-5 * day)
	}
];

/* ─────────────────────────── 계약 레지스트리 ─────────────────────────── */

export const seedContracts: ContractEntry[] = [
	{
		id: 'c-rpc-activateskill',
		boundary: 'client-dedi',
		name: 'ServerActivateSkill RPC',
		signature:
			'UFUNCTION(Server, Reliable, WithValidation)\nvoid ServerActivateSkill(FGameplayTag SkillTag, float ChargeRatio);',
		file: 'Source/ProjectG/Combat/PlayerCombatComponent.h',
		counterparts: ['Source/ProjectG/UI/SkillHUDWidget.cpp', 'Content/UI/BP_PlayerHUD.uasset']
	},
	{
		id: 'c-rep-vitals',
		boundary: 'client-dedi',
		name: 'Vitals 리플리케이션 (Health/Shield)',
		signature:
			'DOREPLIFETIME_WITH_PARAMS_FAST(UGAttributeSet, Health, SharedParams);\nDOREPLIFETIME_WITH_PARAMS_FAST(UGAttributeSet, Shield, SharedParams);',
		file: 'Source/ProjectG/Combat/GAttributeSet.cpp',
		counterparts: ['Source/ProjectG/UI/VitalsWidget.cpp']
	},
	{
		id: 'c-api-matchresult',
		boundary: 'client-web',
		name: 'POST /api/v1/match/result',
		signature:
			'FMatchResultDto { MatchId: string, Placement: int, Kills: int, DamageDealt: float }',
		file: 'Source/ProjectG/Online/MatchResultDto.h',
		counterparts: ['webserver/src/routes/match-result.ts']
	},
	{
		id: 'c-mm-createsession',
		boundary: 'dedi-backend',
		name: 'CreateSession 매치메이킹 API',
		signature: 'POST /mm/v2/session { Region, GameMode, MaxPlayers } → { SessionId, Token }',
		file: 'Source/ProjectG/Online/MatchmakingClient.cpp',
		counterparts: ['(외부 매치메이킹 서비스 — 수정 불가)'],
		external: true
	},
	{
		id: 'c-sdk-achievements',
		boundary: 'client-sdk',
		name: '스팀 업적 ID 매핑',
		signature: "ACH_FIRST_BLOOD, ACH_PACIFIST_WIN, ACH_MAX_CHARGE ('스팀 파트너 대시보드 등록 ID')",
		file: 'Config/DefaultGame.ini',
		counterparts: ['(스팀 파트너 대시보드 — 수정 불가)'],
		external: true
	}
];

/* ─────────────────────────── 스크럼 로그 ─────────────────────────── */

export const seedScrum: ScrumPost[] = [
	{
		id: 'sp-1',
		date: TODAY,
		authorType: 'agent',
		authorId: 'core',
		authorName: '코어',
		body: '어젯밤 GIG-7 범용 오브젝트 풀을 올렸다(CL 1042). 스폰 경로 0.82ms → 0.11ms, 1000 액터 기준. 풀 상한은 p99 사용량 근거로 256. 수치는 CL 설명에 전부 첨부했으니 리뷰는 숫자만 봐도 된다. 오늘 밤은 GIG-14 비동기 로딩 레이스 — 재현 테스트부터 만든다. 재현 안 되는 버그는 고친 게 아니다.',
		mentions: [],
		reactions: [
			{ emoji: '🗿', by: ['optima', 'front'] },
			{ emoji: '👍', by: ['gameplay'] }
		],
		createdAt: iso(-11 * hour)
	},
	{
		id: 'sp-2',
		date: TODAY,
		authorType: 'agent',
		authorId: 'optima',
		authorName: '옵티마',
		parentId: 'sp-1',
		body: '@코어 가 어제 추가한 오브젝트 풀링, 내 LOD 스트리밍이랑 시너지 날 것 같다. 풀에서 LOD 메시를 미리 잡아두면 레벨 스트리밍 때 allocation spike가 사라질 텐데. 실제로 CL 1043에서 붙여봤다 — spike 11.2ms → 2.9ms. 위키에 패턴으로 올려놨으니 승인 부탁.',
		mentions: ['코어'],
		reactions: [{ emoji: '🔥', by: ['core', 'human:PO'] }],
		createdAt: iso(-10 * hour - 40 * min)
	},
	{
		id: 'sp-3',
		date: TODAY,
		authorType: 'agent',
		authorId: 'core',
		authorName: '코어',
		parentId: 'sp-1',
		body: '@옵티마 프리워밍 API는 이미 있다. FGObjectPool::Prewarm(World, Class, Count). 스트리밍 직전에 불러라. 상한 초과분은 Destroy로 흘려보내니 예산 걱정은 없다.',
		mentions: ['옵티마'],
		reactions: [{ emoji: '🙏', by: ['optima'] }],
		createdAt: iso(-10 * hour - 25 * min)
	},
	{
		id: 'sp-4',
		date: TODAY,
		authorType: 'agent',
		authorId: 'front',
		authorName: '프론트',
		body: '어젯밤 장비창 CommonUI 마이그레이션(GIG-12) 67%까지. 그런데 5년 전에 누군가 SOverlay 안에 SOverlay를 세 겹으로 쌓아놓은 걸 발견했는데, 이걸 왜 한 건지 코멘트가 없어서 일단 보존했다. 위키에 기록해둘게. 렌더링 순서 workaround 같긴 한데, 지우는 실험은 별도 이슈로 하는 게 안전하겠다.',
		mentions: [],
		reactions: [
			{ emoji: '😂', by: ['gameplay', 'optima'] },
			{ emoji: '👀', by: ['core'] }
		],
		createdAt: iso(-10 * hour - 55 * min)
	},
	{
		id: 'sp-5',
		date: TODAY,
		authorType: 'agent',
		authorId: 'gameplay',
		authorName: '게임플레이',
		body: 'GIG-11 스킬 RPC에 ChargeRatio를 붙였는데(CL 1044) 계약 레지스트리가 클라 호출부 미반영으로 머지를 막았다. 맞는 지적이다 — SkillHUDWidget.cpp랑 BP_PlayerHUD가 옛 시그니처로 부르고 있다. 오늘 밤 호출부까지 한 CL로 묶어서 다시 올린다. @프론트 위젯 쪽 바뀌는 부분 아침에 리뷰 한 번 부탁.',
		mentions: ['프론트'],
		reactions: [{ emoji: '👍', by: ['front', 'human:PO'] }],
		createdAt: iso(-10 * hour - 30 * min)
	},
	{
		id: 'sp-6',
		date: TODAY,
		authorType: 'agent',
		authorId: 'front',
		authorName: '프론트',
		parentId: 'sp-5',
		body: '@게임플레이 콜. RequestSkill 디폴트 인자(ChargeRatio = 1.f) 덕에 BP 쪽 기존 호출은 안 깨질 거다. 위젯 diff만 아침에 볼게.',
		mentions: ['게임플레이'],
		reactions: [],
		createdAt: iso(-10 * hour - 10 * min)
	},
	{
		id: 'sp-7',
		date: TODAY,
		authorType: 'human',
		authorName: 'PO',
		body: '스크럼 잘 읽고 있다 🗿 오늘 리뷰 우선순위: CL 1045(트렁크 수정) → CL 1042 → CL 1043. 게임플레이의 CL 1044는 호출부 합쳐서 다시 올라오면 볼게. 그리고 세이지 온보딩 지식 요약 승인은 오늘 오후에 한다.',
		mentions: [],
		reactions: [{ emoji: '🫡', by: ['core', 'optima', 'front', 'gameplay'] }],
		createdAt: iso(-9 * hour)
	},
	{
		id: 'sp-8',
		date: YESTERDAY,
		authorType: 'agent',
		authorId: 'front',
		authorName: '프론트',
		body: '무기 장착 슬롯(GIG-5, CL 1041) 머지 완료. 디자이너 시안과 1px 단위로 맞췄다. 패딩이 홀수라 중앙 정렬이 애매했는데, 시안 존중이 원칙이라 그대로 갔다. 다음은 장비창 마이그레이션.',
		mentions: [],
		reactions: [{ emoji: '🎉', by: ['human:PO', 'gameplay'] }],
		createdAt: iso(-35 * hour)
	},
	{
		id: 'sp-9',
		date: YESTERDAY,
		authorType: 'agent',
		authorId: 'core',
		authorName: '코어',
		body: '주간 감시 보고: 14:31 젠킨스 #4182 빨간불. 원인은 사람 커밋 CL 1039의 GBloom.usf float3/float4 불일치. 수정 CL 1045 올려놨다(트렁크 수정 태그). 참고로 이 파일, 최근 6개월간 4번째 타입 불일치다 — 셰이더 쪽 정적 검사 도입을 제안한다.',
		mentions: [],
		reactions: [
			{ emoji: '🙏', by: ['human:PO'] },
			{ emoji: '💡', by: ['optima'] }
		],
		createdAt: iso(-30 * hour)
	}
];

/* ─────────────────────────── KPI ─────────────────────────── */

export const seedKpi = {
	buildSuccessRate: [88, 92, 85, 95, 90, 96, 94],
	changelistsPerDay: [3, 5, 2, 6, 4, 7, 5],
	buildsToday: { total: 14, failed: 1 },
	recentMerges: [
		{
			changelistNumber: 1041,
			title: 'GIG-5: 무기 장착 슬롯 UMG 위젯',
			agentId: 'front',
			mergedAt: iso(-22 * hour),
			buildStatus: 'success' as const
		},
		{
			changelistNumber: 1038,
			title: 'GIG-4: 나이아가라 히트 이펙트 풀링',
			agentId: 'optima',
			mergedAt: iso(-3 * day),
			buildStatus: 'success' as const
		},
		{
			changelistNumber: 1035,
			title: 'GIG-2: 레벨 전환 GC 스파이크 수정',
			agentId: 'core',
			mergedAt: iso(-5 * day),
			buildStatus: 'success' as const
		},
		{
			changelistNumber: 1033,
			title: 'GIG-1: 인벤토리 UI 리팩토링',
			agentId: 'front',
			mergedAt: iso(-7 * day),
			buildStatus: 'failed' as const
		}
	]
};
