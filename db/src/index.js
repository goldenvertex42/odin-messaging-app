// db/src/index.js
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;
console.log("CRITICAL CHECK - Backend connecting to database:", process.env.DATABASE_URL);
// 1. Establish the native PostgreSQL TCP connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Wrap the pool in Prisma 7's mandatory driver adapter layer
const adapter = new PrismaPg(pool);

// 3. Instantiate the client by explicitly passing the adapter option
export const prisma = new PrismaClient({ adapter });

export * from '@prisma/client';
