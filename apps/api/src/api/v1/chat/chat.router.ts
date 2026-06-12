import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { chatController } from './chat.controller';

export const chatRouter = Router();

chatRouter.post('/rooms', authenticate, chatController.createRoom);

chatRouter.get('/conversations', authenticate, chatController.getConversations);

chatRouter.get('/:chatId/messages', authenticate, chatController.getMessages);

// REST fallback for sending messages (also handled via Socket.IO)
chatRouter.post('/:chatId/messages', authenticate, chatController.sendMessage);

chatRouter.get('/turn-credentials', authenticate, chatController.getTurnCredentials);
