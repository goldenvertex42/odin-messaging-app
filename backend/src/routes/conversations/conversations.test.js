import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../../../db/src/index.js';
import { clearDatabase, generateTestToken } from '../../../tests/helpers.js';

describe('Conversations & Messages API - Integration Suite (Stateless JWT)', () => {
  const testUser = { email: 'conversation_tester@odin.com', username: 'chat_tester', passwordHash: 'dummy_hash' };
  const recipientUser = { email: 'recipient_tester@odin.com', username: 'recipient_tester', passwordHash: 'dummy_hash' };
  
  let userJwtToken = '';
  let initiatorRecord;
  let targetUserRecord;
  let activeConversationId;

  beforeEach(async () => {
    await clearDatabase();

    initiatorRecord = await prisma.user.create({ data: testUser });
    targetUserRecord = await prisma.user.create({ data: recipientUser });

    userJwtToken = generateTestToken(initiatorRecord.id);
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  // ==========================================
  // 1. ROUTE PROTECTION TESTS
  // ==========================================
  describe('Route Protection', () => {
    it('GET /api/conversations - should return 401 if user is not authenticated', async () => {
      const res = await request(app).get('/api/conversations');
      expect(res.status).toBe(401);
    });

    it('GET /api/conversations - should return 200 if user is authenticated via JWT token', async () => {
      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${userJwtToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/conversations/:id - should return 401 for unauthenticated requests', async () => {
      const fallbackId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app).get(`/api/conversations/${activeConversationId || fallbackId}`);
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // 2. CONVERSATION CREATION TESTS
  // ==========================================
  describe('POST /api/conversations', () => {
    it('should return 401 for unauthenticated creation attempts', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .send({ usernames: [targetUserRecord.username] });
      expect(res.status).toBe(401);
    });

    it('should successfully build a 1:1 direct messaging thread', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ usernames: [targetUserRecord.username] });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      
      const conv = res.body.data || res.body;
      expect(conv).toHaveProperty('id');
      expect(conv.isGroup).toBe(false);
      
      // Capture the ID locally inside the suite context closure scope
      activeConversationId = conv.id; 
    });

    it('should return a single conversation detail for an authenticated participant', async () => {
      // Setup: Seed a thread explicitly since beforeEach clears the db before this step runs
      const preSeededConversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: initiatorRecord.id },
              { userId: targetUserRecord.id }
            ]
          }
        }
      });

      const res = await request(app)
        .get(`/api/conversations/${preSeededConversation.id}`)
        .set('Authorization', `Bearer ${userJwtToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const conv = res.body.data || res.body;
      expect(conv).toHaveProperty('id', preSeededConversation.id);
      expect(conv).toHaveProperty('participants');
      expect(Array.isArray(conv.participants)).toBe(true);
    });

    it('should return the existing conversation object instead of a duplicate for 1:1 threads', async () => {
      // Setup: Create the original baseline room first to test backend idempotency
      const originalConversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: initiatorRecord.id },
              { userId: targetUserRecord.id }
            ]
          }
        }
      });

      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ usernames: [targetUserRecord.username] });

      expect(res.status).toBe(200); 
      expect(res.body.success).toBe(true);
      
      const conv = res.body.data || res.body;
      expect(conv.id).toBe(originalConversation.id);
    });

    it('should successfully build an empty group chat channel room', async () => {
      const extraUser = await prisma.user.create({
        data: { email: 'extra_group_member@odin.com', username: 'extra_member', passwordHash: 'dummy_hash' }
      });

      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ 
          usernames: [initiatorRecord.username, targetUserRecord.username, extraUser.username],
          name: 'The Odin Room',
          isGroup: true 
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      
      const conv = res.body.data || res.body;
      expect(conv.name).toBe('The Odin Room');
      expect(conv.isGroup).toBe(true);
    });

    it('should drop a 400 Bad Request error if essential keys are missing', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ usernames: [] }); 
      
      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // 3. MESSAGE APPENDING TESTS
  // ==========================================
  describe('POST /api/conversations/:id/messages', () => {
    let mockConversation;

    beforeEach(async () => {
      mockConversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: initiatorRecord.id },
              { userId: targetUserRecord.id }
            ]
          }
        }
      });
    });

    it('should throw a 401 unauthorized if token header is missing', async () => {
      const res = await request(app)
        .post(`/api/conversations/${mockConversation.id}/messages`)
        .send({ content: 'Orphaned message' });
      
      expect(res.status).toBe(401);
    });

    it('should write a raw string message node to an open conversation', async () => {
      const res = await request(app)
        .post(`/api/conversations/${mockConversation.id}/messages`)
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ content: 'Hello World from TOP!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      
      const msg = res.body.data || res.body;
      expect(msg).toHaveProperty('id');
      expect(msg.content).toBe('Hello World from TOP!');
    });

    it('should ingest cloud attachment URLs correctly', async () => {
      const res = await request(app)
        .post(`/api/conversations/${mockConversation.id}/messages`)
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ content: 'Attached file payload', fileUrl: 'https://cloudinary.com' });

      expect(res.status).toBe(201);
      
      const msg = res.body.data || res.body;
      expect(msg.fileUrl).toBe('https://cloudinary.com');
    });

    it('should intercept empty message bodies with a 400 validation code', async () => {
      const res = await request(app)
        .post(`/api/conversations/${mockConversation.id}/messages`)
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ content: '' });
      
      expect(res.status).toBe(400);
    });

    it('should prevent outside users from sending payloads to foreign conversations', async () => {
      const foreignId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/conversations/${foreignId}/messages`)
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ content: 'Intrusion text' });
      
      expect(res.status).toBe(403);
    });
  });
});
