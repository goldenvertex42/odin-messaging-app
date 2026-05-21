# JavaScript Monorepo Template (Vite + Express + Prisma 7)

A highly structured, reusable JavaScript-only monorepo template built using **npm workspaces**. Engineered specifically as a boilerplate for The Odin Project advanced node paths (e.g., Messaging App, Odin Book).

## Architecture Overview

```text
js-monorepo-template/
├── db/              # Prisma 7 schema + PostgreSQL Driver Adapter (pg)
├── backend/         # Express API server + Database initialization check
├── frontend/        # Vite + React client application
├── .env             # Global environment variables (Single source of truth)
└── package.json     # Workspace management and orchestrator scripts
```

## Prerequisites

- Node.js **v22+** or **v24+** (Uses native `--env-file` flags)
- A running PostgreSQL database instance

## Quick Start

1. **Clone and Setup Environment**
   ```bash
   cp .env.example .env
   # Update your DATABASE_URL in your newly created .env file
   ```

2. **Install Dependencies & Symlink Workspaces**
   ```bash
   npm install
   ```

3. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

4. **Sync Database Schema**
   ```bash
   npm run db:push
   ```

5. **Start Development Environment (Concurrently)**
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

## Global CLI Scripts


| Command | Action |
| :--- | :--- |
| `npm run dev` | Spins up Vite frontend and Express backend simultaneously |
| `npm run db:generate` | Compiles the Prisma 7 client engine using direct routing |
| `npm run db:push` | Syncs schema states to the database without generating migrations |
| `npm run build` | Automates backend dependency injection and compiles frontend distribution files |

