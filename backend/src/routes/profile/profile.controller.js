import { prisma } from '../../../../db/src/index.js';

/**
 * 🎯 FETCH USER PROFILE BY USERNAME
 * Used for public directory lookups when clicking on a user's avatar.
 */
export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user?.id; // Extracted via your auth gating middleware

  try {
    await prisma.user.update({
      where: { id: currentUserId },
      data: { isOnline: true } // Forces database parity across multi-device tabs
    });

    // 1. Locate the requested base profile information
    const userProfile = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        themePreference: true,
        isOnline: true,
        createdAt: true
      }
    });

    if (!userProfile) {
      return res.status(404).json({ 
        success: false, 
        error: 'The requested user profile does not exist in our system.' 
      });
    }

    // 2. Initialize default baseline relationship token status
    let relationshipStatus = 'NONE';

    // 3. Evaluate context mapping if checking another workspace actor
    if (currentUserId && currentUserId !== userProfile.id) {
      const relationshipLedger = await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: userProfile.id },
            { senderId: userProfile.id, receiverId: currentUserId }
          ]
        }
      });

      if (relationshipLedger) {
        // Explicitly map ledger status states straight to frontend string expectations
        relationshipStatus = relationshipLedger.status; // Returns: 'PENDING' or 'ACCEPTED'
      }
    }

    // 4. Return combined dataset back to client useProfileSession engine
    return res.status(200).json({
      success: true,
      data: {
        ...userProfile,
        relationshipStatus // Injected token variable string
      }
    });

  } catch (error) {
    console.error('User profile query failure:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};


export const getProfileByUsername = async (req, res, next) => {
  try {
    const username = req.query.query;
    const currentUserId = req.user?.id;

    if (!username || username.trim() === '') {
      return res.status(200).json({ success: true, data: [] });
    }

    const matchingUsers = await prisma.user.findMany({
      where: {
        username: {
          startsWith: username.trim(),
          mode: 'insensitive'
        },
        NOT: {
          id: currentUserId
        }
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true
      },
      take: 5
    });

    console.log('Matching users:', matchingUsers);

    return res.status(200).json({ success: true, data: matchingUsers });
  } catch (error) {
    next(error);
  }
};


/**
 * 🎯 SELF-MUTATING PROFILE PATCH
 * Handles profile edits for updates to bio, display name, avatars, and theme states.
 */
export const updateUserProfile = async (req, res) => {
  const currentUserId = req.user.id;
  const { displayName, bio, avatarUrl, themePreference } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl && { avatarUrl }),
        ...(themePreference && { themePreference })
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        themePreference: true
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Self profile mutation failure:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to update user profile parameters.' 
    });
  }
};