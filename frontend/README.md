# Vite + React Frontend Workspace (`frontend`)

This workspace houses the client-side user interface for the monorepo application. It is scaffolded with **Vite** and **React**, stripped of default clutter, and optimized to work seamlessly alongside the shared backend architecture.

## Core Features

- **Lightweight Structure**: All default Vite assets, styles, and logos have been removed to keep the template boilerplate minimal and clean.
- **Pre-configured API Integration**: Features an instant end-to-end `fetch` handshake component inside `App.jsx` to test local cross-origin communications with the Express server right out of the box.
- **Optimized Port Alignment**: Hardcoded to utilize Vite's standard local dev port (`5173`), matching the dynamic backend CORS configuration perfectly.

## Architecture & Folders

- `/public`: Empty asset folder preserved for static resources (images, icons, manifests) via a hidden `.gitkeep` file.
- `/src`: Ultra-clean React compilation target containing only your primary rendering layout files (`main.jsx` and `App.jsx`).

## Local Execution

Monorepo orchestration automatically boots this development server concurrently from the root directory via `npm run dev`. If isolated client execution is required, you can target the workspace directly:

```bash
npm run dev --workspace=packages/frontend
```
