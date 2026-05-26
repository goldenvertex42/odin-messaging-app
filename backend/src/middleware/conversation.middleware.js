import { prisma } from '../../../db/src/index.js';

export const isConversationParticipant = async (req, res, next) => {
  try {
    const conversationId = req.params.id; // Keep as a raw string ID
    const userId = req.user.id;

    if (!conversationId) {
      return res.status(400).json({ success: false, error: 'Invalid conversation ID format' });
    }

    // Check strict string mappings across your explicit schema relationships
    const participantRecord = await prisma.participant.findFirst({
      where: {
        conversationId: conversationId,
        userId: userId
      }
    });

    if (!participantRecord) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied: You are not a participant in this conversation' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
