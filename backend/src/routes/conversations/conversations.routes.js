import { Router } from 'express';
import passport from 'passport';
import { isConversationParticipant } from '../../middleware/conversation.middleware.js';
import { getConversations, createConversation, getConversation, createMessage } from './conversations.controller.js';

const router = Router();

// Secure ALL endpoints in this file with stateless JWT token extraction
router.use(passport.authenticate('jwt', { session: false }));

// Base collection endpoints (req.user is now guaranteed to exist here)
router.get('/', getConversations);
router.post('/', createConversation);

// Contextual conversation endpoints
router.get('/:id', isConversationParticipant, getConversation);

// Contextual message sub-routes (Passes through JWT validation, then your participant gate)
router.post('/:id/messages', isConversationParticipant, createMessage);

export default router;

