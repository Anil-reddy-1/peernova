import type { Request, Response, NextFunction } from 'express';
import { aiService } from './ai.service';
import { z } from 'zod';

export class AIController {
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, conversationId, context } = req.body;
      const userId = req.user!.uid;
      
      if (!message || !conversationId) {
        res.status(400).json({ error: 'message and conversationId are required' });
        return;
      }
      
      await aiService.streamChat(userId, message, conversationId, context || {}, res);
    } catch (error) {
      next(error);
    }
  }

  async generateQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = z.object({
        subject: z.string(),
        topic: z.string(),
        difficulty: z.enum(['easy', 'medium', 'hard']),
        count: z.number().min(1).max(20)
      });
      
      const { subject, topic, difficulty, count } = schema.parse(req.body);
      const quiz = await aiService.generateQuiz(subject, topic, difficulty, count);
      
      res.status(200).json({
        success: true,
        data: quiz,
        meta: null,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }

  async summarizeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, transcript } = req.body;
      const userId = req.user!.uid;
      
      const summary = await aiService.summarizeSession(sessionId, userId, transcript);
      
      res.status(200).json({
        success: true,
        data: summary,
        meta: null,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }

  async studyRoadmap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = z.object({
        subject: z.string(),
        currentLevel: z.string(),
        targetLevel: z.string(),
        availableHoursPerWeek: z.number()
      });
      
      const parsed = schema.parse(req.body);
      const roadmap = await aiService.createStudyRoadmap(
        parsed.subject, 
        parsed.currentLevel, 
        parsed.targetLevel, 
        parsed.availableHoursPerWeek
      );
      
      res.status(200).json({
        success: true,
        data: roadmap,
        meta: null,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
