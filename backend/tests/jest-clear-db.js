import { prisma } from '../../db/src/index.js';

export const clearDatabase = async () => {
  // Must clear tables in reverse order of foreign key relationships 
  // to avoid blocking constraint violations
  await prisma.message.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.friendship.deleteMany({});
  await prisma.user.deleteMany({});
};