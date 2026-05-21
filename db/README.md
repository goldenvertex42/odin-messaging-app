# DB Workspace Package (`db`)

This workspace handles the application data layer. It isolates database model configurations and implements Prisma 7's mandatory JavaScript driver adapters.

## Core Stack

- **Prisma 7**: Database ORM
- **pg (node-postgres)**: Native PostgreSQL TCP socket connection pool
- **@prisma/adapter-pg**: Middleware engine connecting Prisma to the `pg` pool

## Architecture

This package exports a single instantiated `prisma` client. It bypasses Prisma 7's removed direct engine connection rules by feeding a native connection pool right into the constructor.

```javascript
import { prisma } from 'db';
// Ready for CRUD operations instantly across other workspaces
```

## Local Development Quirks
To prevent module resolution issues and missing `prisma/config` errors inside nested monorepos, **always execute database operations from the project root folder** using the root utility scripts (`npm run db:generate`, `npm run db:push`).
