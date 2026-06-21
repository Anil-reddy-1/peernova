import { Router } from 'express';
import { aiController } from './ai.controller';
import { authenticate } from '../../../middleware/auth';

export const aiRouter = Router();

aiRouter.post('/chat', authenticate, aiController.chat);
aiRouter.post('/quiz', authenticate, aiController.generateQuiz);
aiRouter.post('/summarize-session', authenticate, aiController.summarizeSession);
aiRouter.post('/study-roadmap', authenticate, aiController.studyRoadmap);
