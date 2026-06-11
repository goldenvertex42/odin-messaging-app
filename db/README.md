# 🗄️ Database & Prisma ORM Engine Workspace (`/db`)

This workspace handles our production PostgreSQL data schemas, type declarations, database generation, and mock seed records.

## 📁 Key File Configurations
* `prisma/schema.prisma`: The master source of truth data architecture definition. Contains entity relational mappings for users, profile states, friend lists, message contents, and conversation channels.
* `prisma/direct-seed.js`: Hydrates local systems with sandbox testing companion profiles.

## 📦 Core Scripts
* `npm run db:push`: Pushes changes directly to your local database without generating a migration history track.
* `npm run db:migrate`: Creates and applies a fresh SQL migration path.
* `npm run db:generate`: Compiles our explicit Prisma schema into your local `node_modules` directory, creating typed code intelligence variables.
