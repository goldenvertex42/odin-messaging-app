import { Router } from 'express';
import passport from 'passport';
import { registerUser, loginUser, getMe } from './auth.controller.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', passport.authenticate('local', { session: false }), loginUser);
router.get('/me', passport.authenticate('jwt', { session: false }), getMe);

export default router;
