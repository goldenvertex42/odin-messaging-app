// backend/src/routes/profile/profile.test.js
import request from 'supertest';
import app from '../../app.js'; // Points directly to your Express application orchestrator
import { prisma } from '../../../../db/src/index.js';
import { clearDatabase, generateTestToken } from '../../../tests/helpers.js';

describe('Profile Domain API - Integration Suite (Stateless JWT)', () => {
  const primaryUser = {
    email: 'profile_master@odin.com',
    username: 'profile_boss',
    displayName: 'Original Display Name',
    bio: 'Initial user bio status text.',
    themePreference: 'SLATE'
  };

  const secondaryUser = {
    email: 'external_viewer@odin.com',
    username: 'external_view',
    displayName: 'External Buddy',
    bio: 'Public profile description notes.',
    themePreference: 'OCEAN'
  };

  let userJwtToken = '';
  let activeUserRecord;
  let companionUserRecord;

  // Wipes and seeds base profiles before every individual test pass
  beforeEach(async () => {
    await clearDatabase();

    // 1. Seed pristine user row state instances cleanly into your test database [1]
    activeUserRecord = await prisma.user.create({ data: primaryUser });
    companionUserRecord = await prisma.user.create({ data: secondaryUser });

    // 2. Hydrate token mapping strings for the primary authenticated session user
    userJwtToken = generateTestToken(activeUserRecord.id);
  });

  // AUTOMATED CLEANUP AFTER SUITE CLOSES
  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  // ==========================================
  // 1. GET USER PROFILE ROUTE TESTS
  // ==========================================
  describe('GET /api/profile/:username', () => {
    it('should throw a 401 unauthorized if token header is missing', async () => {
      const res = await request(app).get(`/api/profile/${companionUserRecord.username}`);
      expect(res.status).toBe(401);
    });

    it('should safely return any public profile details to an authenticated user', async () => {
      const res = await request(app)
        .get(`/api/profile/${companionUserRecord.username}`)
        .set('Authorization', `Bearer ${userJwtToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const profile = res.body.data || res.body;
      expect(profile.username).toBe(secondaryUser.username);
      expect(profile.displayName).toBe(secondaryUser.displayName);
      expect(profile.bio).toBe(secondaryUser.bio);
      expect(profile.themePreference).toBe(secondaryUser.themePreference);
      // Security Gate: Ensure sensitive database parameters like passwords never leak out!
      expect(profile).not.toHaveProperty('passwordHash');
    });

    it('should drop a 404 Not Found error if the targeted handle username does not exist', async () => {
      const res = await request(app)
        .get('/api/profile/completely_non_existent_username_handle')
        .set('Authorization', `Bearer ${userJwtToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 2. PATCH USER PROFILE ROUTE TESTS
  // ==========================================
  describe('PATCH /api/profile', () => {
    it('should throw a 401 unauthorized if token header is missing on update attempts', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .send({ displayName: 'Hacker Name Change' });
      expect(res.status).toBe(401);
    });

    it('should successfully update authenticated user records and change theme tokens', async () => {
      const updatedPayload = {
        displayName: 'Upgraded Display Title',
        bio: 'This is my brand new updated bio description paragraph.',
        themePreference: 'AMETHYST'
      };

      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send(updatedPayload);

      expect(res.status).toBe(200);
      
      // Enforce validation against your standardized data unwrap payload boundaries
      const profile = res.body.data || res.body;
      expect(profile.displayName).toBe(updatedPayload.displayName);
      expect(profile.bio).toBe(updatedPayload.bio);
      expect(profile.themePreference).toBe(updatedPayload.themePreference);

      // 🎯 True Live Check: Confirm the rows mutated inside your PostgreSQL test database instantly [1]
      const databaseCheckRow = await prisma.user.findUnique({ where: { id: activeUserRecord.id } });
      expect(databaseCheckRow.displayName).toBe(updatedPayload.displayName);
      expect(databaseCheckRow.bio).toBe(updatedPayload.bio);
      expect(databaseCheckRow.themePreference).toBe(updatedPayload.themePreference);
    });

    it('should safely ignore unexpected or non-existent schema modification attributes', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${userJwtToken}`)
        .send({ 
          displayName: 'Clean Name',
          maliciousInjectedKey: 'DROP TABLE user;', 
          id: 'try-to-override-my-id-uuid' // Attempted tracking exploit parameter
        });

      expect(res.status).toBe(200);
      
      const profile = res.body.data || res.body;
      // Confirm core identity remains completely untouched and secure
      expect(profile.id).toBe(activeUserRecord.id);
      expect(profile).not.toHaveProperty('maliciousInjectedKey');
    });
  });
});
