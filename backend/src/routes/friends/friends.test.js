// backend/src/tests/friends.test.js
import request from 'supertest';
import { prisma } from '../../../../db/src/index.js';
import app from '../../app.js';
import { clearDatabase, generateTestToken } from '../../../tests/helpers.js';

describe('Friends Domain Mutation API Integration Matrix', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('❌ should reject decisions with 400 Bad Request if the action is malformed', async () => {
    const user = await prisma.user.create({ data: { email: 'u1@test.com', username: 'u1' } });
    const token = generateTestToken(user.id);

    const res = await request(app)
      .patch('/api/friends/requests/some-id-string')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'MALFORMED_ACTION_TYPE' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid decision token payload');
  });

  it('❌ should block un-authorized users with 403 Forbidden if they do not own the request', async () => {
    const sender = await prisma.user.create({ data: { email: 'sender@test.com', username: 'sender' } });
    const receiver = await prisma.user.create({ data: { email: 'receiver@test.com', username: 'receiver' } });
    const attacker = await prisma.user.create({ data: { email: 'attacker@test.com', username: 'attacker' } });

    const friendshipRequest = await prisma.friendship.create({
      data: { senderId: sender.id, receiverId: receiver.id, status: 'PENDING' }
    });

    // Attacker tries to accept the request
    const attackerToken = generateTestToken(attacker.id);

    const res = await request(app)
      .patch(`/api/friends/requests/${friendshipRequest.id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ action: 'ACCEPTED' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('🟢 should execute atomic deletion on a live transaction when action matches REJECTED', async () => {
    const sender = await prisma.user.create({ data: { email: 's@test.com', username: 's' } });
    const receiver = await prisma.user.create({ data: { email: 'r@test.com', username: 'r' } });

    const targetRequest = await prisma.friendship.create({
      data: { senderId: sender.id, receiverId: receiver.id, status: 'PENDING' }
    });

    const receiverToken = generateTestToken(receiver.id);

    const res = await request(app)
      .patch(`/api/friends/requests/${targetRequest.id}`)
      .set('Authorization', `Bearer ${receiverToken}`)
      .send({ action: 'REJECTED' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('rejected and deleted successfully');

    // Confirm true SQL deletion
    const rowCheck = await prisma.friendship.findUnique({ where: { id: targetRequest.id } });
    expect(rowCheck).toBeNull();
  });

  it('🟢 should shift relationship state to ACCEPTED on successful validation matching', async () => {
    const sender = await prisma.user.create({ data: { email: 's2@test.com', username: 's2' } });
    const receiver = await prisma.user.create({ data: { email: 'r2@test.com', username: 'r2' } });

    const targetRequest = await prisma.friendship.create({
      data: { senderId: sender.id, receiverId: receiver.id, status: 'PENDING' }
    });

    const receiverToken = generateTestToken(receiver.id);

    const res = await request(app)
      .patch(`/api/friends/requests/${targetRequest.id}`)
      .set('Authorization', `Bearer ${receiverToken}`)
      .send({ action: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACCEPTED');

    const databaseRow = await prisma.friendship.findUnique({ where: { id: targetRequest.id } });
    
    expect(databaseRow).not.toBeNull(); 
    expect(databaseRow.status).toBe('ACCEPTED');
  });
});
