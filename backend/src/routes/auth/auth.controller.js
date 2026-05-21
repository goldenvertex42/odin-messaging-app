import bcrypt from 'bcryptjs';
import passport from 'passport';
import { prisma } from '../../../../db/src/index.js';

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
        displayName,
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

    return res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

export const loginUser = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || 'Login failed.' });

    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.status(200).json({ message: 'Logged in successfully.', user });
    });
  })(req, res, next);
};

export const getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
  return res.status(200).json(req.user);
};
