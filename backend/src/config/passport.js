import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt'; // Add this import
import bcrypt from 'bcryptjs';
import { prisma } from '../../../db/src/index.js';

// 1. PASSPORT-LOCAL STRATEGY (Used strictly during POST /api/auth/login)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        if (!user.passwordHash) {
          return done(null, false, { 
            message: 'Account registered via third-party provider. Please sign in with OAuth.' 
          });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// 2. PASSPORT-JWT STRATEGY (Used to protect all other incoming API requests)
passport.use(
  new JWTStrategy(
    {
      // Automatically extracts "Bearer <token>" from the Authorization header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'fallback_secret_key_for_testing',
    },
    async (jwtPayload, done) => {
      try {
        // Fetch the user based on the ID stored in the token payload
        const user = await prisma.user.findUnique({
          where: { id: jwtPayload.id },
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            isOnline: true,
          },
        });

        if (!user) {
          return done(null, false); // Token is valid, but user no longer exists
        }

        return done(null, user); // Successfully populates req.user
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

export default passport;
