import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from './config/passport.js'; 
import { prisma } from "../../db/src/index.js";
import authRouter from './routes/auth/auth.routes.js';
import conversationsRouter from './routes/conversations/conversations.routes.js';

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

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true requires HTTPS production certificates
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // Session lifespan: 7 Days
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/api/test', (req, res) => {
  res.json({ message: "🚀 Hello from the monorepo backend API!" });
});
app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationsRouter);

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

if (process.env.NODE_ENV !== 'test') {
  testDbConnection();
  const server = app.listen(PORT, () => {
    console.log(`Odin Message App - listening on port ${PORT}!`);
  });

  server.on('error', (error) => {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  });
}

export default app;