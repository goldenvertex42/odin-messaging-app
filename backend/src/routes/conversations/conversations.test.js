import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../../../db/src/index.js';

describe('Conversations API - Route Protection Tests', () => {
  const testUser = {
    email: 'conversation_tester@odin.com',
    username: 'chat_tester',
    password: 'password123'
  };

  // Setup a clean test user to authenticate with
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    
    // Create the user in the database directly
    await request(app)
      .post('/api/auth/register')
      .send(testUser);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  // 1. VERIFY BLOCKING (Should pass now with 401 instead of 404)
  it('GET /api/conversations - should return 401 if user is not authenticated', async () => {
    const res = await request(app).get('/api/conversations');
    expect(res.status).toBe(401);
  });

  // 2. VERIFY ALLOWING THROUGH (Should pass with 200)
  it('GET /api/conversations - should return 200 if user is authenticated via session', async () => {
    const agent = request.agent(app); // An agent maintains cookies across multiple requests

    // First, log in using the agent to save the session cookie
    await agent
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    // Next, make the protected request using the same agent instance
    const res = await agent.get('/api/conversations');
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

