import { Router } from 'express';
import passport from 'passport';
import { 
  getFriendsList, 
  getPendingFriendRequests, 
  handleFriendRequestDecision
} from './friends.controller.js';

const router = Router();
const jwtAuth = passport.authenticate('jwt', { session: false });

router.get('/', jwtAuth, getFriendsList);
router.get('/requests', jwtAuth, getPendingFriendRequests);
router.patch('/requests/:id', jwtAuth, handleFriendRequestDecision);

export default router;
