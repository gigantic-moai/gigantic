# 🗿 Gigantic: Moai

> **AI agents write code overnight, humans review in the morning.**

Gigantic is an **Unreal Engine Agentic Development Platform**. AI agents work on assigned
issues overnight, submit changelists to Perforce, and post a morning scrum log. Humans come
in, read the scrum, and review — that's it.

Built for professional UE + Perforce teams (AAA studios). Perforce is a **hard dependency**
by design: exclusive locking, workspace isolation and view mappings are used natively —
no VCS abstraction layer, no Git support planned.

## The four pillars

| Module | Role |
|--------|------|
| 🔌 **UE Runtime Bridge** | Two-way communication between agents and the UE editor/runtime (editor commands, runtime state, build pipeline, log streaming). Debugging is powered by the external [Quilla](https://github.com/zaffre001/quilla) debugger which embeds this platform. |
| 📊 **Dashboard** | The single interface. Kanban, overview, waterfall, review, wiki, scrum, agent management. |
| 📚 **Knowledge Base** | Implementation patterns, asset↔system mappings, change history — mined from P4 changesets, approved by humans. |
| 📜 **Contracts Registry** | Interface contracts across system boundaries. Contract violations block merges before humans ever see them. |

## Quick start

```bash
# 0. Colima instead of Docker Desktop
brew install colima docker docker-compose
colima start --cpu 4 --memory 8

# 1. Clone
git clone https://github.com/gigantic-moai/gigantic.git
cd gigantic

# 2. Configure — P4 server info is all you need
cp .env.example .env

# 3. Run — that's everything
docker compose up -d

# 4. Install the UE bridge (on the build machine)
unrealbridge install --engine "/path/to/UE5"

# 5. Open the dashboard — everything else happens there
open http://localhost:3000
```

### Dashboard development

```bash
pnpm install
pnpm dev          # → http://localhost:5173
```

Without `DATABASE_URL`, the dashboard runs on a built-in in-memory mock engine
(seeded agents, issues, changelists, scrum logs) — ideal for development and demos.

## Repository layout

```
gigantic/
├── apps/
│   ├── dashboard/    ← SvelteKit dashboard (7 views + Moai avatar generator)
│   └── bridge/       ← UE runtime bridge (orchestrator, onboarding, parallelizer)
├── packages/
│   └── shared/       ← Types shared between dashboard and bridge
├── docker-compose.yml
└── .env.example
```

## Principles

1. **Perforce is a hard dependency.** UE treats P4 as a first-class citizen; so do we.
2. **The dashboard is the only interface.** Apart from the install CLI, everything happens in the web UI.
3. **A work agent, not a deploy agent.** Your existing CI (Jenkins etc.) keeps owning builds/deploys.
4. **Spawn once, autonomous after.** 🗿 Spawn is pressed once; agents then follow their schedule.

## License

TBD (§18 — under review: MIT / Apache-2.0).
