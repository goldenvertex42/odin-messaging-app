import { Router } from 'express';
import passport from 'passport';
import { 
  getFriendsList, 
  getUserProfile, 
  updateUserProfile,
  getPendingFriendRequests
} from './users.controller.js';

const router = Router();

const jwtAuth = passport.authenticate('jwt', { session: false });

router.get('/friends', jwtAuth, getFriendsList);
router.get('/friends/requests', jwtAuth, getPendingFriendRequests);
router.get('/profile/:username', jwtAuth, getUserProfile);
router.patch('/profile', jwtAuth, updateUserProfile);

export default router;
