import type { Request, Response, NextFunction } from 'express';
import { chatService } from './chat.service';

export class ChatController {
  async getTurnCredentials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const credentials = chatService.getTurnCredentials(userId);

      res.status(200).json({
        success: true,
        data: credentials,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const page = parseInt(((req.query.page as string)) || '1', 10);
      const limit = parseInt(((req.query.limit as string)) || '20', 10);

      const result = await chatService.getConversations(userId, page, limit);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const { chatId } = req.params as Record<string, string>;
      const page = parseInt(((req.query.page as string)) || '1', 10);
      const limit = parseInt(((req.query.limit as string)) || '20', 10);

      const result = await chatService.getMessages(chatId as string, userId, page, limit);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const { participantId, initialMessage } = req.body;
      
      if (!participantId) {
        res.status(400).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'participantId is required', details: null }
        });
        return;
      }

      const result = await chatService.createRoom(userId, participantId, initialMessage);

      res.status(201).json({
        success: true,
        data: result,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.uid;
      const chatIdParam = req.params.chatId;
      const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
      const { content } = req.body;

      if (!chatId) {
        res.status(400).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'chatId is required', details: null }
        });
        return;
      }

      if (!content?.trim()) {
        res.status(400).json({
          success: false,
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'Message content is required', details: null }
        });
        return;
      }

      const message = await chatService.sendMessage(chatId, userId, content.trim());

      res.status(201).json({
        success: true,
        data: message,
        meta: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
