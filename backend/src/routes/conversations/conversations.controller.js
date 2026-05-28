import { prisma } from '../../../../db/src/index.js';

// GET /api/conversations
export const getConversations = async (req, res) => {
  const userId = req.user.id; // Extracted from your Passport-JWT barrier middleware

  try {
    const channels = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      orderBy: [
        { updatedAt: 'desc' },
        { id: 'desc' }
      ],
      include: {
        // 🎯 THE CRITICAL FIX: Fetch only the single most recent message
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: { id: true, username: true } // Include ID so frontend can compare for 'You'
            }
          }
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, isOnline: true }
            }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('Failed to synchronize sidebar channels:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};



// POST /api/conversations
export const createConversation = async (req, res) => {
  try {
    const { isGroup, usernames, name } = req.body;
    const currentUserId = req.user.id;

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ success: false, error: 'An array of participant usernames is required.' });
    }

    // 🎯 STEP 1: Look up database profiles from the provided usernames
    const profiles = await prisma.user.findMany({
      where: {
        username: { in: usernames }
      }
    });

    // Verify all input handles match actual records in the user table
    if (profiles.length !== usernames.length) {
      const foundNames = profiles.map(p => p.username);
      const missingNames = usernames.filter(name => !foundNames.includes(name));
      return res.status(404).json({ 
        success: false, 
        error: `Could not initialize thread. The following usernames do not exist: ${missingNames.join(', ')}` 
      });
    }

    // Extract resolved target user database IDs safely
    const targetIds = profiles.map(p => p.id);

    // Block user from spinning up a direct message thread with themselves
    if (!isGroup && targetIds.includes(currentUserId)) {
      return res.status(400).json({ success: false, error: 'You cannot initiate a 1:1 chat with yourself.' });
    }

    // 🎯 STEP 2: Handle 1:1 Direct Messaging Idempotency
    if (!isGroup) {
      const recipientId = targetIds[0];

      // Scan existing 1:1 conversations for the current user
      const existingChats = await prisma.conversation.findMany({
        where: {
          isGroup: false,
          participants: { some: { userId: currentUserId } }
        },
        include: { participants: true }
      });

      // Filter results to find a strict isolated pair match containing the recipient
      const strictPairChat = existingChats.find(chat => 
        chat.participants.length === 2 && 
        chat.participants.some(p => p.userId === recipientId)
      );

      if (strictPairChat) {
        return res.status(200).json({ success: true, data: strictPairChat });
      }

      // Create a fresh 1:1 direct conversation if no previous record exists
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

    // 🎯 STEP 3: Handle Multi-User Group Chat Creation
    // Filter out the active creator to prevent duplicate assignment keys
    const cleanInviteeIds = targetIds.filter(id => id !== currentUserId);
    const uniqueInvitees = [...new Set(cleanInviteeIds)];

    const groupParticipants = [
      { userId: currentUserId, isAdmin: true },
      ...uniqueInvitees.map(id => ({ userId: id, isAdmin: false }))
    ];

    // Format a fallback group title label block if missing from input values
    const fallbackTitle = `Group with ${usernames.slice(0, 2).join(', ')}`;
    const groupName = name?.trim() || fallbackTitle;

    const newGroupChat = await prisma.conversation.create({
      data: {
        isGroup: true,
        name: groupName,
        participants: {
          create: groupParticipants
        }
      },
      include: { participants: true }
    });

    return res.status(201).json({ success: true, data: newGroupChat });

  } catch (error) {
    console.error('Create conversation error exception:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};


// GET /api/conversations/:id
export const getConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
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
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    return res.status(200).json({ success: true, data: conversation });
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
