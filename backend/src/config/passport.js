import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../db/src/index.js';

// Configure the Passport-Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email', // Users will log in using their email
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // Look up the user by email
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        // Catch OAuth-only users attempting a standard password login
        if (!user.passwordHash) {
          return done(null, false, { message: 'Account registered via third-party provider. Please sign in with OAuth.' });
        }

        // Verify the provided password against the hashed record
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        // Authentication succeeds, pass the user object along
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialize user into the session store (stores just the user ID)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session store back into req.user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
