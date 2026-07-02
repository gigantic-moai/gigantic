#!/usr/bin/env node
/**
 * unrealbridge — UE 브릿지 설치 CLI (§12 설치 스텝 4)
 *
 *   unrealbridge install --engine "/path/to/UE5"      .uplugin을 엔진에 복사
 *   unrealbridge sidecar                              headless sidecar 실행 안내
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const command = args[0];

function flag(name) {
	const idx = args.indexOf(`--${name}`);
	return idx !== -1 ? args[idx + 1] : undefined;
}

if (command === 'install') {
	const engine = flag('engine');
	if (!engine) {
		console.error('사용법: unrealbridge install --engine "/path/to/UE5"');
		process.exit(1);
	}
	const engineRoot = resolve(engine);
	if (!existsSync(engineRoot)) {
		console.error(`엔진 경로를 찾을 수 없습니다: ${engineRoot}`);
		process.exit(1);
	}
	const pluginDir = join(engineRoot, 'Engine', 'Plugins', 'GiganticBridge');
	mkdirSync(pluginDir, { recursive: true });
	copyFileSync(join(here, '..', 'plugin', 'GiganticBridge.uplugin'), join(pluginDir, 'GiganticBridge.uplugin'));
	console.log('🗿 Gigantic Bridge 플러그인 설치 완료');
	console.log(`   → ${join(pluginDir, 'GiganticBridge.uplugin')}`);
	console.log('');
	console.log('다음 단계:');
	console.log('  1. UE 에디터 재시작 후 Plugins에서 "Gigantic Bridge" 활성화');
	console.log('  2. 오케스트레이터 주소 설정: 대시보드 → 환경설정 → 포트 · UE 브릿지');
	console.log('  3. 디버깅(DAP)은 Quilla가 담당합니다: https://github.com/zaffre001/quilla');
} else if (command === 'sidecar') {
	console.log('headless sidecar 실행:');
	console.log('  ORCHESTRATOR_PORT=4000 pnpm --filter @gigantic/bridge start');
	console.log('(에디터 없는 빌드 머신에서 브릿지 프로토콜을 제공합니다)');
} else {
	console.log('unrealbridge <command>');
	console.log('');
	console.log('  install --engine <path>   UE 엔진에 브릿지 플러그인(.uplugin) 설치');
	console.log('  sidecar                   headless sidecar 실행 안내');
	process.exit(command ? 1 : 0);
}
