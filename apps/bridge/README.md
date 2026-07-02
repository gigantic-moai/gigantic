# 🔌 UE Runtime Bridge (오케스트레이터)

에이전트와 UE 에디터를 잇는 브릿지 서비스입니다. `:4000`에서 HTTP `/status`와
WebSocket `/bridge` 프로토콜을 제공합니다.

```bash
pnpm --filter @gigantic/bridge dev     # → http://localhost:4000/status
```

현재 UE 에디터 자리는 **mock 에디터**가 대신합니다 — 프로토콜(계약)은 실제 플러그인이
붙어도 그대로 유지됩니다. 프로토콜 타입은 `@gigantic/shared`의 `types/bridge.ts`에 있습니다.

| 메시지 | 스펙 | 동작 |
|---|---|---|
| `editor-command` | BR-01 | 블루프린트 컴파일 · 레벨 로드 · PIE 시작/중지 |
| `runtime-state` | BR-02 | 액터 목록, 변수 값 조회 |
| `build` | BR-04 | 빌드 트리거 → 진행률 이벤트 → 결과 |
| `subscribe-logs` | BR-05 | UE OutputLog 형식 실시간 스트리밍 |

```
src/
├── orchestrator/    ← 에이전트 스케줄 판정 (§11)
├── onboarding/      ← changeset 파서, 패턴 후보/핫스팟 추출 (§8)
├── parallelizer/    ← 워크스페이스 뷰 매핑 계획, .uasset 충돌 감지 (§4)
├── knowledge/       ← UFUNCTION(Server/Client) RPC 계약 추출/변경 감지 (§7.3)
└── ue-connector/    ← 에디터 통신 계층 (현재 mock)
```

## 플러그인 설치 (§12)

```bash
unrealbridge install --engine "/path/to/UE5"
# → Engine/Plugins/GiganticBridge/GiganticBridge.uplugin
```

## 디버거 (BR-03)

DAP 디버거 연동은 이 리포지토리에서 구현하지 않습니다. 외부 디버거
**[Quilla](https://github.com/zaffre001/quilla)** 가 이 플랫폼을 포함(임베드)하는 형태로
제공되며, 대시보드의 디버거 패널은 Quilla가 노출하는 세션에 연결됩니다.
