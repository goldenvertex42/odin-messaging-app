import { Router } from 'express';
import passport from 'passport';
import { getUserProfile, updateUserProfile, getProfileByUsername } from './profile.controller.js';

const router = Router();
const jwtAuth = passport.authenticate('jwt', { session: false });

router.get('/search', jwtAuth, getProfileByUsername);
router.get('/:username', jwtAuth, getUserProfile);
router.patch('/', jwtAuth, updateUserProfile);

export default router;
