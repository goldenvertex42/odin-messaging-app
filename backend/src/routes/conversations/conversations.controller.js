import { prisma } from '../../../../db/src/index.js';

// GET /api/conversations
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: { 
        participants: { some: { userId: userId } } 
      },
      include: {
        // CORRECT: Use uniform select layers when filtering nested model properties
        participants: {
          select: {
            id: true,
            isAdmin: true,
            userId: true,
            user: {
              select: { 
                id: true, 
                displayName: true, 
                avatarUrl: true, 
                isOnline: true 
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    // This logs the exact trace in your terminal if any other syntax bugs creep in
    console.error("❌ Prisma Conversations Fetch Crash:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};


// POST /api/conversations
export const createConversation = async (req, res) => {
  try {
    const { isGroup, recipientId, name, userIds } = req.body;
    const currentUserId = req.user.id;

    // 1. Handle 1:1 Direct Messaging Idempotency
    if (!isGroup) {
      if (!recipientId) {
        return res.status(400).json({ success: false, error: 'recipientId is required for 1:1 chats' });
      }
      if (recipientId === currentUserId) {
        return res.status(400).json({ success: false, error: 'You cannot start a 1:1 chat with yourself' });
      }

      // STYLED FIX: Enforce that the matched conversation has EXACTLY 2 participants total
      const existingChat = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: { some: { userId: currentUserId } }
        },
        include: { participants: true }
      });

      // Filter local memory results to guarantee a strict isolated pair match
      const strictPairChat = existingChat && existingChat.participants.length === 2 && 
        existingChat.participants.some(p => p.userId === recipientId) ? existingChat : null;

      if (strictPairChat) {
        return res.status(200).json({ success: true, data: strictPairChat });
      }

      const newDirectChat = await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: currentUserId, isAdmin: true },
              { userId: recipientId, isAdmin: false }
            ]
          }
        },
        include: { participants: true }
      });
      return res.status(201).json({ success: true, data: newDirectChat });
    }

    // 2. Handle Group Chat Creation
    if (!name) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    // Ensure current creator is stripped out of input lists to prevent duplicate records
    const cleanUserIds = Array.isArray(userIds) ? userIds.filter(id => id !== currentUserId) : [];
    const uniqueInvitees = [...new Set(cleanUserIds)];
    
    const groupParticipants = [
      { userId: currentUserId, isAdmin: true },
      ...uniqueInvitees.map(id => ({ userId: id, isAdmin: false }))
    ];

    const newGroupChat = await prisma.conversation.create({
      data: {
        isGroup: true,
        name: name,
        participants: { create: groupParticipants }
      },
      include: { participants: true }
    });
    return res.status(201).json({ success: true, data: newGroupChat });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/conversations/:id/messages
export const createMessage = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { content, fileUrl } = req.body;
    const senderId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: 'Message content cannot be empty' });
    }

    // CRITICAL FIX: Wrapped inside a single database transaction block
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: content,
          fileUrl: fileUrl || null,
          conversationId: conversationId,
          senderId: senderId
        }
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })
    ]);

    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
