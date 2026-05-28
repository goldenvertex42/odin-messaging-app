import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

async function run() {
  const dbUrl = process.env.DATABASE_URL || 'NOT FOUND';
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':******@');
  console.log(`🔌 Seed script is actively attempting connection to: ${maskedUrl}`);
  
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    await client.query('BEGIN;');

    console.log("🌱 Starting direct SQL database seeding with dynamic profile support...");

    // 1. Clean the database in reverse order of foreign keys
    console.log("🧹 Wiping existing data...");
    await client.query('TRUNCATE TABLE "friendship", "message", "participant", "conversation", "user" CASCADE;');

    // 2. Hash a common password for testing
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    // 3. Seed Users with updated Glyphs avatars and ProfileTheme preferences
    console.log("👥 Injecting test users with themes and glyph avatars...");
    const usersData = [
      [
        'alice@odin.com', 
        'alice_dev', 
        'Alice Smith', 
        defaultPasswordHash, 
        'Building the Odin Messaging App!', 
        'https://api.dicebear.com/10.x/glyphs/svg', 
        'AMETHYST', 
        true
      ],
      [
        'bob@odin.com', 
        'bob_builder', 
        'Bob Jones', 
        defaultPasswordHash, 
        'Can we fix it? Yes we can.', 
        'https://api.dicebear.com/10.x/glyphs/svg',
        'OCEAN', 
        true
      ],
      [
        'charlie@odin.com', 
        'charlie_brown', 
        'Charlie Brown', 
        defaultPasswordHash, 
        'Good grief.', 
        'https://api.dicebear.com/10.x/glyphs/svg', 
        'EMERALD', 
        false
      ],
      [
        'dave@odin.com', 
        'dave_codes', 
        'Dave Miller', 
        defaultPasswordHash, 
        'Fullstack explorer.', 
        'https://api.dicebear.com/10.x/glyphs/svg',
        'SLATE', 
        false
      ]
    ];

    const userIds = {};
    for (const row of usersData) {
      const res = await client.query(
        `INSERT INTO "user" (
          id, 
          email, 
          username, 
          "displayName", 
          "passwordHash", 
          bio, 
          "avatarUrl", 
          "themePreference", 
          "isOnline", 
          "createdAt", 
          "updatedAt"
        ) 
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7::"ProfileTheme", $8, NOW(), NOW()
        ) 
        RETURNING id, username;`, 
        row
      );
      
      const createdUser = res.rows[0];
      if (createdUser && createdUser.username) {
        userIds[createdUser.username] = createdUser.id;
      }
    }

    console.log("Verified Extracted userIds Matrix:", userIds);

    // 4. Seed Friendships
    console.log("🤝 Establishing friendships...");
    const friendships = [
      [userIds.alice_dev, userIds.bob_builder, 'ACCEPTED'],
      [userIds.alice_dev, userIds.charlie_brown, 'ACCEPTED'],
      [userIds.dave_codes, userIds.alice_dev, 'PENDING']
    ];

    for (const f of friendships) {
      await client.query(
        `INSERT INTO "friendship" (id, "senderId", "receiverId", status, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3::"FriendshipStatus", NOW(), NOW());`, 
        f
      );
    }

    // 5. Seed 1-on-1 Conversation (Alice & Bob)
    console.log("💬 Creating 1-on-1 Chat...");
    const directChatRes = await client.query(
      `INSERT INTO "conversation" (id, "isGroup", "createdAt", "updatedAt") VALUES (gen_random_uuid(), false, NOW(), NOW()) RETURNING id;`
    );
    const directChatId = directChatRes.rows[0].id;

    await client.query(`INSERT INTO "participant" (id, "userId", "conversationId", "isAdmin", "joinedAt") VALUES (gen_random_uuid(), $1, $2, false, NOW());`, [userIds.alice_dev, directChatId]);
    await client.query(`INSERT INTO "participant" (id, "userId", "conversationId", "isAdmin", "joinedAt") VALUES (gen_random_uuid(), $1, $2, false, NOW());`, [userIds.bob_builder, directChatId]);

    // Add 1-on-1 messages
    const directMessages = [
      [directChatId, userIds.alice_dev, 'Hey Bob! Did you see the new Prisma schema?', null],
      [directChatId, userIds.bob_builder, 'Yeah, looks super clean. The join table works perfectly.', null],
      [directChatId, userIds.alice_dev, 'Awesome. Check out this mockup screenshot!', 'https://placehold.co']
    ];

    for (const m of directMessages) {
      await client.query(`INSERT INTO "message" (id, "conversationId", "senderId", content, "fileUrl", "createdAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW());`, m);
    }

    // 6. Seed Group Chat (Alice, Bob, Charlie)
    console.log("👥 Creating Group Chat...");
    const groupChatRes = await client.query(
      `INSERT INTO "conversation" (id, name, "isGroup", "createdAt", "updatedAt") VALUES (gen_random_uuid(), 'Odin Developers Study Group', true, NOW(), NOW()) RETURNING id;`
    );
    const groupChatId = groupChatRes.rows[0].id;

    await client.query(`INSERT INTO "participant" (id, "userId", "conversationId", "isAdmin", "joinedAt") VALUES (gen_random_uuid(), $1, $2, true, NOW());`, [userIds.alice_dev, groupChatId]);
    await client.query(`INSERT INTO "participant" (id, "userId", "conversationId", "isAdmin", "joinedAt") VALUES (gen_random_uuid(), $1, $2, false, NOW());`, [userIds.bob_builder, groupChatId]);
    await client.query(`INSERT INTO "participant" (id, "userId", "conversationId", "isAdmin", "joinedAt") VALUES (gen_random_uuid(), $1, $2, false, NOW());`, [userIds.charlie_brown, groupChatId]);

    // Add group messages
    const groupMessages = [
      [groupChatId, userIds.charlie_brown, 'Hello everyone! Glad to be here.', null],
      [groupChatId, userIds.alice_dev, 'Welcome Charlie! We are talking about Passport auth next.', null],
      [groupChatId, userIds.bob_builder, 'Passport local strategy is pretty straightforward.', null]
    ];

    for (const m of groupMessages) {
      await client.query(`INSERT INTO "message" (id, "conversationId", "senderId", content, "fileUrl", "createdAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW());`, m);
    }

    await client.query('COMMIT;');
    console.log("🚀 Direct data injection successful with Glyph avatars! Run your app and login with password: password123");

  } catch (error) {
    await client.query('ROLLBACK;');
    console.error("❌ Transaction failed. Database rolled back to clear state.", error);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
