import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { prisma } from "../../db/src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true);

const allowedOrigin = process.env.VITE_API_URL 
  ? process.env.VITE_API_URL.replace(':3000', ':5173') 
  : 'http://localhost:5173';

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_FRONTEND_URL : allowedOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true, 
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: "🚀 Hello from the monorepo backend API!" });
});

async function testDbConnection() {
  try {
    // Tries to read 1 record from your placeholder template model
    await prisma.user.findMany({ take: 1 });
    console.log("✅ Database connection successful!");
  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error(error.message);
  }
}

testDbConnection();

const server = app.listen(PORT, () => {
  console.log(`Odin Message App - listening on port ${PORT}!`);
});

server.on('error', (error) => {
  console.error("Server failed to start:", error.message);
  process.exit(1);
});