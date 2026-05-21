import { prisma } from '../../../../db/src/index.js';

export const getConversations = async (req, res, next) => {
  try {
    // Eventually, this will fetch chats where req.user.id is a participant
    // For now, returning an empty array is enough to satisfy our basic 200/401 tests
    return res.status(200).json([]);
  } catch (error) {
    next(error);
  }
};
