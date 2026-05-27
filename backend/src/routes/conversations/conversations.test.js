import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../../../db/src/index.js';
import { clearDatabase } from '../../../jest-clear-db.js';

describe('Conversations & Messages API - TDD Suite (Stateless JWT)', () => {
  const testUser = { 
    email: 'conversation_tester@odin.com', 
    username: 'chat_tester', 
    password: 'password123' 
  };
  const recipientUser = { 
    email: 'recipient_tester@odin.com', 
    username: 'recipient_tester', 
    password: 'password123' 
  };

  let userJwtToken = '';
  let targetUserRecord;
  let activeConversationId;

  // AUTOMATED CLEANUP BEFORE SUITE RUNS
  beforeAll(async () => {
    await clearDatabase();
    
    // 1. Register accounts
    const regUser = await request(app).post('/api/auth/register').send(testUser);
    await request(app).post('/api/auth/register').send(recipientUser);
    
    targetUserRecord = await prisma.user.findUnique({ where: { email: recipientUser.email } });
    
    // 2. Capture the stateless bearer token instead of creating an agent session
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
      
    userJwtToken = loginRes.body.token;
  });

  // AUTOMATED CLEANUP AFTER SUITE CLOSES
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
        .set('Authorization', `Bearer ${userJwtToken}`); // Replaces stateful cookie verification
        
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/conversations/:id - should return 401 for unauthenticated requests', async () => {
      const res = await request(app).get(`/api/conversations/${activeConversationId || 1}`);
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
        .send({ isGroup: false, recipientId: targetUserRecord.id });
      expect(res.status).toBe(401);
    });

    it('should successfully build a 1:1 direct messaging thread', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ isGroup: false, recipientId: targetUserRecord.id });

      if (res.status !== 201) console.error('❌ 1:1 Create Error Body:', res.body);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.isGroup).toBe(false);
      activeConversationId = res.body.data.id;
    });

    it('should return a single conversation detail for an authenticated participant', async () => {
      const res = await request(app)
        .get(`/api/conversations/${activeConversationId}`)
        .set('Authorization', `Bearer ${userJwtToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', activeConversationId);
      expect(res.body.data).toHaveProperty('participants');
      expect(Array.isArray(res.body.data.participants)).toBe(true);
    });

    it('should return the existing conversation object instead of a duplicate for 1:1 threads', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ isGroup: false, recipientId: targetUserRecord.id });

      if (res.status !== 200) console.error('❌ Idempotency Check Error Body:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(activeConversationId);
    });

    it('should successfully build an empty group chat channel room', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ isGroup: true, name: 'The Odin Room', userIds: [targetUserRecord.id] });

      if (res.status !== 201) console.error('❌ Group Create Error Body:', res.body);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('The Odin Room');
      expect(res.body.data.isGroup).toBe(true);
    });

    it('should drop a 400 Bad Request error if essential keys are missing', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ isGroup: true });
      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // 3. MESSAGE APPENDING TESTS
  // ==========================================
  describe('POST /api/conversations/:id/messages', () => {
    it('should throw a 401 unauthorized if token header is missing', async () => {
      const res = await request(app)
        .post(`/api/conversations/${activeConversationId || 1}/messages`)
        .send({ content: 'Orphaned message' });
      expect(res.status).toBe(401);
    });

    it('should write a raw string message node to an open conversation', async () => {
      const res = await request(app)
        .post(`/api/conversations/${activeConversationId}/messages`)
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ content: 'Hello World from TOP!' });

      if (res.status !== 201) console.error('❌ Send Message Error Body:', res.body);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.content).toBe('Hello World from TOP!');
    });

    it('should ingest cloud attachment URLs correctly', async () => {
      const res = await request(app)
        .post(`/api/conversations/${activeConversationId}/messages`)
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ content: 'Attached file payload', fileUrl: 'https://cloudinary.com' });

      if (res.status !== 201) console.error('❌ Attachment Msg Error Body:', res.body);
      expect(res.status).toBe(201);
      expect(res.body.data.fileUrl).toBe('https://cloudinary.com');
    });

    it('should intercept empty message bodies with a 400 validation code', async () => {
      const res = await request(app)
        .post(`/api/conversations/${activeConversationId}/messages`)
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ content: '' });
      expect(res.status).toBe(400);
    });

    it('should prevent outside users from sending payloads to foreign conversations', async () => {
      const foreignId = '00000000-0000-0000-0000-000000000000'; // Formatted clean fallback string ID
      const res = await request(app)
        .post(`/api/conversations/${foreignId}/messages`)
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ content: 'Intrusion text' });

      if (res.status !== 403) console.error('❌ Foreign Intrusion Error Body:', res.body);
      expect(res.status).toBe(403);
    });
  });
});
