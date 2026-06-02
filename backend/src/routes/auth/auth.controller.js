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

    // Create the user record
    const newUser = await prisma.user.create({
      data: { 
        email, 
        username, 
        displayName: displayName || username, 
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

export const loginUser = (req, res, next) => {
  try {
    // Passport's middleware successfully completed, so req.user is ready!
    const user = req.user;

    // Clean up sensitive table maps before sending to your React client
    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isOnline: user.isOnline
    };

    // Issue the stateless web token
    const token = generateToken(user.id);

    return res.status(200).json({
      message: 'Logged in successfully.',
      token,
      user: safeUser
    });
  } catch (error) {
    return next(error);
  }
};

export const logoutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
}

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

