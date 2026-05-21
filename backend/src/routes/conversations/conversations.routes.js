import { Router } from 'express';
import { getConversations } from './conversations.controller.js';
import { isAuthenticated } from '../../middleware/auth.middleware.js';

const router = Router();

// Protect the entire route file or specific endpoints using your middleware
router.get('/', isAuthenticated, getConversations);

export default router;
