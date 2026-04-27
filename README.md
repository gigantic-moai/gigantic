# 🗿 Gigantic

> **AI agents write Unreal Engine code overnight; humans review in the morning.**

Gigantic (codename **Moai**) is an agentic development platform for Unreal Engine. AI agents pick up issues, write C++/Blueprint code, and submit changelists to Perforce while you sleep. In the morning, you review the diffs from a single dashboard — no terminal required after install.

---

## ⚙️ Prerequisites

| Tool       | Version  | Notes                                           |
| ---------- | -------- | ----------------------------------------------- |
| Node.js    | ≥ 20     | corepack ships with it                          |
| pnpm       | 9.x      | enable via `corepack enable pnpm`               |
| Colima     | latest   | used in place of Docker Desktop                 |
| Docker CLI | latest   | `brew install docker docker-compose`            |

> **Note**: We deliberately do **not** use Docker Desktop. On macOS, install with `brew install colima docker docker-compose` and start the VM once with `colima start`.

---

## 🚀 Quick Start

```bash
# 1. Environment
cp .env.example .env

# 2. Install dependencies
pnpm install

# 3. Start Colima if it's not already running
colima start

# 4. Bring up the stack — Postgres + dashboard
docker compose up -d

# 5. Open the dashboard
open http://localhost:3000
```

Once the dashboard is up, the sidebar gives you Kanban, Overview, Waterfall, Review, Wiki, Scrum, and Agent Management views. (At the W1–2 milestone every view is a placeholder; real implementations land in W3+.)

### Local development without containers

```bash
docker compose up -d db        # Postgres only
pnpm db:migrate                # apply schema
pnpm dev                       # http://localhost:3000 with HMR
```

---

## 🗂️ Project Structure

```
gigantic/
├── apps/
│   └── dashboard/          # SvelteKit dashboard (the main UI)
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/   # shared components
│       │   │   └── server/
│       │   │       ├── db/       # Drizzle schema + connection
│       │   │       └── p4/       # Perforce client (stub)
│       │   ├── routes/           # page routes
│       │   └── app.css
│       ├── drizzle.config.ts
│       └── Dockerfile
├── packages/
│   └── shared/             # types shared between dashboard and bridge
├── docker-compose.yml
└── .env.example
```

---

## 🛠️ Common Scripts

```bash
pnpm dev                # dashboard dev server with HMR
pnpm build              # build every package
pnpm check              # type-check (svelte-check)

pnpm db:generate        # generate migration SQL from schema changes
pnpm db:migrate         # apply migrations
pnpm db:push            # (dev only) push schema directly
```

---

## 🧱 Stack

| Area        | Choice                                     |
| ----------- | ------------------------------------------ |
| Package     | pnpm + workspace                           |
| Framework   | SvelteKit 2 + Svelte 5                     |
| ORM         | Drizzle ORM (postgres-js)                  |
| Database    | PostgreSQL 16                              |
| Styling     | Tailwind CSS 4 (`@tailwindcss/vite`)       |
| Icons       | lucide-svelte                              |
| Containers  | Colima + Docker Compose                    |
| Target VCS  | Perforce (agents submit to P4)             |

---

## 📋 Status

- ✅ **W1–2 (Track D-1)**: Project bootstrap — monorepo, DB schema, dashboard shell, placeholder routes
- ⏳ **W3–4 (Track D-2)**: Kanban implementation — issue CRUD, drag-and-drop, WebSocket sync, P4 changelist integration

---

## 📜 License

TBD.
