import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../../../db/src/index.js';

describe('Authentication API Integration Tests (Stateless JWT)', () => {
  const testUser = {
    email: 'tdd_user@odin.com',
    username: 'tdd_coder',
    password: 'securepassword123',
    displayName: 'TDD Tester'
  };

  let activeJwtToken = ''; // Tracks token across test lifecycles

  // Clean the database before running tests
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  // Clean up database links and close open hooks
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  // 1. TEST REGISTRATION (Verifies account creation and initial token issue)
  it('POST /api/auth/register - should create a new user profile and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  // 2. TEST ACTIVE PROFILE CHECK - UNAUTHENTICATED (Verifies stateless rejection)
  it('GET /api/auth/me - should return 401 if token is missing', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  // 3. TEST LOGIN & JWT TOKEN TRANSMISSION (Verifies login returns valid tokens)
  it('POST /api/auth/login - should authenticate and return a signed JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ 
        email: testUser.email, 
        password: testUser.password 
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Logged in successfully');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);

    // Save the token to use in the authenticated profile query below
    activeJwtToken = res.body.token; 
  });

  // 4. TEST ACTIVE PROFILE CHECK - AUTHENTICATED (Verifies header validation works)
  it('GET /api/auth/me - should return user profile data when valid token is provided', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${activeJwtToken}`); // Injects stateless auth header

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testUser.email);
    expect(res.body.username).toBe(testUser.username);
    expect(res.body).not.toHaveProperty('passwordHash');
  });
});
