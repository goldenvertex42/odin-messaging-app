# Express Backend Workspace (`backend`)

A modern Node.js Express application utilizing native ES Modules (`import/export`) and automated process monitoring.

## Core Features

- **Native Env Loading**: Uses Node's built-in `--env-file` execution engine.
- **Dynamic Local CORS**: Automatically replaces backend production ports with Vite's default dev port (`5173`) to ease local pipeline development.
- **Boot Smoke Test**: Fires a lightweight connection query against the database workspace the microsecond the server initializes to catch environment configurations early.

## Local Execution

Monorepo orchestration automatically boots this server via the root directory. If isolated execution is needed:
```bash
node --env-file=../../.env --watch src/app.js