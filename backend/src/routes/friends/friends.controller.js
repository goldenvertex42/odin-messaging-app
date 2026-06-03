import { prisma } from '../../../../db/src/index.js';
/**
 * 🎯 FETCH FRIENDS LIST
 * Queries friendships where user is either sender or receiver and status is ACCEPTED.
 */
export const getFriendsList = async (req, res) => {
  const currentUserId = req.user.id;

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true }
        },
        receiver: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true }
        }
      }
    });

    // Strip out the logged-in user to return only the partner user profile payloads
    const friends = friendships.map((bond) => {
      return bond.senderId === currentUserId ? bond.receiver : bond.sender;
    });

    return res.status(200).json({
      success: true,
      data: friends
    });
  } catch (error) {
    console.error('Friends list lookup failure:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getPendingFriendRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const pendingRequests = await prisma.friendship.findMany({
      where: {
        receiverId: currentUserId,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(pendingRequests);
  } catch (error) {
    console.error('Prisma pending requests retrieval fail:', error);
    return res.status(500).json({ error: 'Failed to fetch incoming friend requests.' });
  }
};

export const handleFriendRequestDecision = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const { action } = req.body; // Expects exactly: 'ACCEPTED' or 'REJECTED'
    const currentUserId = req.user?.id;

    // 1. Guard against unexpected payload shapes early
    if (!['ACCEPTED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid decision token payload. Action must be 'ACCEPTED' or 'REJECTED'." 
      });
    }

    // 2. Locate the existing friendship ledger record to verify eligibility
    const pendingRequest = await prisma.friendship.findUnique({
      where: { id: requestId }
    });

    if (!pendingRequest) {
      return res.status(404).json({ success: false, error: 'Friend request record not found.' });
    }

    // Security Gate: Ensure the current authenticated user is actually the intended receiver
    if (pendingRequest.receiverId !== currentUserId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden. You are not authorized to decide on this relationship track.' 
      });
    }

    // Ensure we aren't mutating an already completed interaction
    if (pendingRequest.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false, 
        error: 'This friend request has already been processed.' 
      });
    }

    // 3. ATOMIC TRANSACTION PIPELINE
    const transactionResult = await prisma.$transaction(async (tx) => {
      if (action === 'REJECTED') {
        // Option A: Call delete straight out of the database safely
        await tx.friendship.delete({
          where: { id: requestId }
        });
        return { action, message: 'Friend request rejected and deleted successfully.' };
      }

      // Option B: Flip the FriendshipStatus enum state to ACCEPTED
      const updatedFriendship = await tx.friendship.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
        include: {
          sender: { select: { id: true, username: true, displayName: true } }
        }
      });

      return { 
        action, 
        message: 'Friend request accepted successfully.', 
        data: updatedFriendship 
      };
    });

    return res.status(200).json({ success: true, ...transactionResult });

  } catch (error) {
    return next(error);
  }
};
