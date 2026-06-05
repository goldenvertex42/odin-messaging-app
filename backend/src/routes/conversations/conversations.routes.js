import { Router } from 'express';
import passport from 'passport';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { isConversationParticipant } from '../../middleware/conversation.middleware.js';
import { getConversations, createConversation, getConversation, createMessage } from './conversations.controller.js';

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'odin-uploads', // Stored inside this cloud folder bucket
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }] // Automated lightweight size optimization safeguard
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Maximum file upload size
});

router.use(passport.authenticate('jwt', { session: false }));

router.get('/', getConversations);
router.post('/', createConversation);

router.get('/:id', isConversationParticipant, getConversation);

router.post('/:id/messages', isConversationParticipant, upload.single('image'), createMessage);

export default router;

