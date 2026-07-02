# 🔌 UE Runtime Bridge

브릿지 트랙(B-1 ~ B-7)에서 구현되는 백엔드 모듈입니다. 이 리포지토리 체크아웃은
**대시보드 프론트엔드 트랙(D-1 ~ D-7)** 결과물이며, 브릿지는 구조만 잡혀 있습니다.

```
src/
├── orchestrator/    ← 에이전트 스케줄링, 라이프사이클 (§11)
├── onboarding/      ← P4 changeset → 지식 자동 구축 (§8)
├── parallelizer/    ← P4 워크스페이스, Shared DDC, 충돌 감지 (§4)
├── knowledge/       ← 지식 엔진, 계약 레지스트리 (§6, §7)
└── ue-connector/    ← UE 에디터 소켓 통신, 빌드 트리거 (§3)
```

## 디버거 (BR-03)

DAP 디버거 연동은 이 리포지토리에서 구현하지 않습니다. 외부 디버거
**[Quilla](https://github.com/zaffre001/quilla)** 가 이 플랫폼을 포함(임베드)하는 형태로
제공되며, 대시보드의 디버거 패널은 Quilla가 노출하는 세션에 연결됩니다.
