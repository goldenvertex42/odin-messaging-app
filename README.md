# 🟢 Odin Messaging App (Full-Stack Monorepo)

An engineering-grade, real-time single-page messaging platform featuring fluid, mobile-first responsive layout structures, secure JWT session pipelines, and automated full-stack production deployments.

## 🛠️ System Architecture & Workspace Mapping

This repository is configured as an **npm Workspaces Monorepo** to tightly manage dependencies, build pipelines, and testing suites under a unified project directory structure:

```text
odin-messaging-app (Monorepo Root)
├── backend/       # Express API Gateway, Authentication Middleware, & Sockets Engine
├── db/            # Prisma Schemas, Client Generators, Database Migrations, & Seed Records
└── frontend/      # Vite + React Client UI, Global Context Handlers, & CSS Modules Layouts
```

## 🚀 Live Production Deployments

* **Frontend Application Client Shell:** Hosted via **Vercel** ([Live App Link](https://odin-messaging-app-sigma.vercel.app))
* **Backend Core API Services:** Run via **Railway Build Pack Containers**

---

## 💻 Tech Stack & Tooling Core

* **Frontend Core Framework:** React (Vite) + React Router v7
* **Styling & Layout Grid Architecture:** Modular CSS (CSS Modules) with fluid Dynamic Viewports (`100dvh`, `100svh`)
* **Backend Server Engine:** Node.js + Express + Passport.js (JWT Stateful Strategies)
* **Database Engine & ORM Ecosystem:** PostgreSQL Instance + Prisma ORM Client
* **Cloud Infrastructure Services:** Cloudinary API (Production Media & Form Attachment CDN Hosting)
* **Test Automation Engineering:** Vitest + React Testing Library + Mock Service Worker (MSW)

---

## 🔧 Local Development Workspace Initialization

### 1. Prerequisite Installations
Ensure you have **Node.js v20+** and **npm v10+** globally mounted to support monorepo workspace resolution layers.

### 2. Clone the Repository & Install Dependencies
Run a top-level installation loop from the root directory to automatically resolve, link, and structure deep workspace tree modules:
```bash
git clone https://github.com
cd odin-messaging-app
npm install
```

### 3. Supply Your Environment Parameter Configurations
Create a `.env` file at the **absolute root of the project** containing your execution keys:
```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/odin_db"
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/odin_test"
JWT_SECRET="your_long_random_development_secret_string"

# ☁️ Cloudinary API Media Infrastructure Keys
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 4. Build Your Local Database Schema Structures
Run your migration scripts from the workspace root directory:
```bash
npm run db:push
npm run db:generate
npm run db:seed
```

### 5. Fire Up Your Full-Stack Development Sandbox Environment
Run the root concurrent execution target script:
```bash
npm run dev
```
* Your frontend will boot up locally at `http://localhost:5173`
* Your backend API server gateway will mount at `http://localhost:3000`

---

## 🧪 Unified Automation Test Suites

Run your localized unit or structural integration tests seamlessly across specific monorepo workspace sandboxes:

```bash
npm run backend:test    # Execute Express Server and Utility Controller Vitest checks
npm run frontend:test   # Execute React UI Layout, Hook Lifecycle, and ImageModal Vitest suites
```

---

## 🎛️ Continuous Integration & Production Build Commands

These commands handle cloud compilations across your automated tracking branches:

### Railway Backend Build Pipeline
* **Root Pipeline Workspace Directory:** `/`
* **Build Task Sequence script:** `npm run db:generate && npm run build`
* **Pre-Deploy Migration Script:** `npx prisma migrate deploy --schema=./db/prisma/schema.prisma`
* **Assigned Railpack Installer Override Engine:** `RAILPACK_INSTALL_CMD = "npm install --legacy-peer-deps"`

### Vercel Frontend Deployment Client
* **Root Pipeline Workspace Directory:** `frontend`
* **Compilation Command Target:** `npm run build`
* **Static Assets Build Output Folder:** `dist`
