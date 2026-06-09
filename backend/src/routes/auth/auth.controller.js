import bcrypt from 'bcryptjs';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../db/src/index.js';

// Helper function to generate stateless JWTs
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET || 'fallback_secret_key_for_testing', 
    { expiresIn: '1d' } // Token expires in 24 hours
  );
};

export const registerUser = async (req, res, next) => {
  try {
    const { email, username, password, displayName } = req.body;

    // Basic validation
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or Username already taken.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const seeds = ['Felix', 'Aneka', 'Harley', 'Buster', 'Kiki', 'Casper', 'Socks', 'Spooky', 'Mittens'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
    const defaultAvatarUrl = `https://api.dicebear.com/10.x/glyphs/svg?seed=${randomSeed}`;

    // Create the user record
    const newUser = await prisma.user.create({
      data: { 
        email, 
        username, 
        displayName: displayName || username, 
        bio: bio || '',
        avatarUrl: defaultAvatarUrl,
        passwordHash 
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isOnline: true,
        createdAt: true
      }
    });

    // Automatically log the user in by generating a token upon registration
    const token = generateToken(newUser.id);

    return res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    // Passport's middleware successfully completed, so req.user is ready!
    const user = req.user;

    // 1. Mutate database state to declare active network presence
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true }
    });

    // 2. Map structural values cleanly using the freshly updated model row
    const safeUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatarUrl: updatedUser.avatarUrl,
      bio: updatedUser.bio,
      isOnline: updatedUser.isOnline,
      themePreference: updatedUser.themePreference
    };

    // Issue the stateless web token
    const token = generateToken(updatedUser.id);

    return res.status(200).json({ 
      message: 'Logged in successfully.', 
      token, 
      user: safeUser 
    });
  } catch (error) {
    return next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    // Capture tracking context identity before Passport clears the request session context
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized payload exception.' 
      });
    }

    if (currentUserId) {
      // 1. Flip presence toggle state back to offline
      await prisma.user.update({
        where: { id: currentUserId },
        data: { isOnline: false }
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Logged out successfully." 
    });

  } catch (error) {
    return next(error);
  }
};

export const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
  
  try {
    // Pull live values directly from database
    const freshUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        themePreference: true
      }
    });
    
    return res.status(200).json(freshUser);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to synchronize live identity attributes.' });
  }
};

