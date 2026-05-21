import request from 'supertest';
import app from '../../app.js'; 
import { prisma } from '../../../../db/src/index.js';

describe('Authentication API Integration Tests', () => {
  const testUser = {
    email: 'tdd_user@odin.com',
    username: 'tdd_coder',
    password: 'securepassword123',
    displayName: 'TDD Tester'
  };

  // Clean the database before running tests
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  // Clean up database links and close open hooks
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  // 1. TEST REGISTRATION (Failing)
  it('POST /api/auth/register - should create a new user profile', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(testUser.email);
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  // 2. TEST ACTIVE SESSION CHECK - UNAUTHENTICATED (Failing)
  it('GET /api/auth/me - should return 401 if not logged in', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  // 3. TEST LOGIN & COOKIE SESSION TRACKING (Failing)
  it('POST /api/auth/login - should authenticate and return session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Logged in successfully');
    
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('connect.sid');
  });
});
