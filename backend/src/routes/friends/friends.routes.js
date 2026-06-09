import { Router } from 'express';
import passport from 'passport';
import { 
  getFriendsList, 
  getPendingFriendRequests,
  sendFriendRequest, 
  handleFriendRequestDecision
} from './friends.controller.js';

const router = Router();
const jwtAuth = passport.authenticate('jwt', { session: false });

router.get('/', jwtAuth, getFriendsList);
router.get('/requests', jwtAuth, getPendingFriendRequests);
router.post('/requests', jwtAuth, sendFriendRequest);
router.patch('/requests/:id', jwtAuth, handleFriendRequestDecision);

export default router;
