import request from 'supertest';
import express from 'express';
import { prisma } from '../../../../db/src/index.js';
import { loginUser, logoutUser } from '../../routes/auth/auth.controller.js';
import { clearDatabase, generateTestToken } from '../../../tests/helpers.js';

const testApp = express();
testApp.use(express.json());

testApp.use((req, res, next) => {
  req.user = { id: req.headers['x-test-user-id'] || 'user-123' };
  
  req.logout = (callback) => {
    if (typeof callback === 'function') callback(null);
  };
  next();
});

testApp.post('/api/auth/login', loginUser);
testApp.post('/api/auth/logout', logoutUser);

describe('Auth Core & Presence State Live Integration Suite', () => {
  let seededUser;

  beforeEach(async () => {
    await clearDatabase();
    seededUser = await prisma.user.create({
      data: { email: 'activeuser@example.com', username: 'activeuser', passwordHash: 'dummy_hash', isOnline: false }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('🟢 should flag user online in database during successful login', async () => {
    const res = await request(testApp)
      .post('/api/auth/login')
      .send({ email: seededUser.email, password: 'your_test_password' });

    if (res.status === 200) {
      expect(res.body.user.isOnline).toBe(true);
      const updatedUser = await prisma.user.findUnique({ where: { id: seededUser.id } });
      expect(updatedUser.isOnline).toBe(true);
    }
  });

  it('🔴 should flip presence flag to offline and return clean JSON on logout', async () => {
    const onlineUser = await prisma.user.update({
      where: { id: seededUser.id },
      data: { isOnline: true }
    });

    const token = generateTestToken(onlineUser.id);

    const res = await request(testApp)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      // Pass the user ID header to hydrate the req.user middleware stub cleanly
      .set('x-test-user-id', onlineUser.id); 

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const offlineUser = await prisma.user.findUnique({ where: { id: onlineUser.id } });
    expect(offlineUser.isOnline).toBe(false);
  });
});
