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

/**
 * 🎯 FETCH USER PROFILE BY USERNAME
 * Used for public directory lookups when clicking on a user's avatar.
 */
export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const userProfile = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        themePreference: true, // Returns SLATE, EMERALD, OCEAN, AMETHYST, or ROSE
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

    return res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('User profile query failure:', error);
    return res.status(500).json({ success: false, error: error.message });
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