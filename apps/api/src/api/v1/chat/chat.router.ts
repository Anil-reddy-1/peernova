import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { chatController } from './chat.controller';

export const chatRouter = Router();

chatRouter.post('/rooms', authenticate, chatController.createRoom);

chatRouter.get('/conversations', authenticate, chatController.getConversations);

chatRouter.get('/:chatId/messages', authenticate, chatController.getMessages);

// The actual message sending should be done via Socket.IO, but we can keep the REST endpoint as fallback
chatRouter.post('/:chatId/messages', authenticate, (_req, res) => {
  res.status(501).json({ success: false, data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Send messages via Socket.IO instead', details: null }, meta: null });
});

chatRouter.get('/turn-credentials', authenticate, chatController.getTurnCredentials);
