import { Router } from 'express';
import passport from 'passport';
import { 
  getFriendsList, 
  getUserProfile, 
  updateUserProfile 
} from './users.controller.js';

const router = Router();

const jwtAuth = passport.authenticate('jwt', { session: false });

router.get('/friends', jwtAuth, getFriendsList);
router.get('/profile/:username', jwtAuth, getUserProfile);
router.patch('/profile', jwtAuth, updateUserProfile);

export default router;
