import { GoogleGenAI } from '@google/genai';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '../../../lib/pino';
import { BadRequestError } from '../../../lib/errors';
import { env } from '../../../config/env';
import type { Response } from 'express';

// Define the Content interface for Gemini since we need to map historical messages
interface Content {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class AIService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY || '',
    });
  }

  /**
   * Tracks token usage per user.
   */
  private async trackUsage(userId: string, tokens: number) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    
    // Using atomic increment
    await userRef.set(
      { 
        aiUsage: {
          tokens: 0 // Fallback
        }
      }, 
      { merge: true }
    );
    
    // Native Firebase admin FieldValue.increment
    const admin = require('firebase-admin');
    await userRef.update({
      'aiUsage.tokens': admin.firestore.FieldValue.increment(tokens),
      'aiUsage.requests': admin.firestore.FieldValue.increment(1)
    });
  }

  /**
   * Handle streaming chat completions via SSE.
   */
  async streamChat(
    userId: string,
    message: string,
    conversationId: string,
    context: { subject?: string; sessionId?: string },
    res: Response
  ) {
    try {
      const db = getFirestore();
      const threadRef = db.collection(`ai-conversations/${userId}/threads`).doc(conversationId);
      const doc = await threadRef.get();
      
      let messages: Content[] = [];
      const systemInstruction = `You are an expert tutor assistant for a peer tutoring marketplace. You help students understand concepts, solve problems, and create study plans. You have access to the student's current subject context: ${context.subject || 'General'}. Be concise, clear, and pedagogically sound. Always encourage critical thinking. If asked to do homework directly, guide the student through the process instead.`;
      
      if (doc.exists) {
        // Map any old OpenAI messages (role: 'system' or 'assistant') to Gemini format just in case
        const rawMessages = doc.data()?.messages || [];
        messages = rawMessages.filter((m: any) => m.role !== 'system').map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts: [{ text: m.content || m.parts?.[0]?.text || '' }]
        }));
      }
      
      messages.push({ role: 'user', parts: [{ text: message }] });
      
      // Limit context window to last 10 messages
      if (messages.length > 10) {
        messages = messages.slice(-10);
      }

      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await this.ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: messages,
        config: {
          systemInstruction,
        }
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.text || '';
        fullResponse += content;
        // Format SSE
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();

      // Persist conversation
      messages.push({ role: 'model', parts: [{ text: fullResponse }] });
      await threadRef.set({
        messages,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Calculate approximate tokens (1 token ~ 4 chars for rough estimation)
      const approxTokens = Math.ceil((message.length + fullResponse.length) / 4);
      await this.trackUsage(userId, approxTokens);

    } catch (error) {
      logger.error({ err: error, userId }, 'Streaming chat error');
      res.write(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`);
      res.end();
    }
  }

  async generateQuiz(subject: string, topic: string, difficulty: 'easy'|'medium'|'hard', count: number) {
    const prompt = `Generate a multiple choice quiz about ${subject} - ${topic}. 
Difficulty: ${difficulty}. Number of questions: ${count}.
Output STRICTLY as a JSON object matching this schema:
{
  "questions": [
    {
      "question": "text",
      "options": ["A", "B", "C", "D"],
      "answer": 0, // index of correct option
      "explanation": "Why this is correct"
    }
  ]
}`;

    const completion = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const content = completion.text;
    if (!content) throw new BadRequestError('Failed to generate quiz');
    
    return JSON.parse(content);
  }

  async summarizeSession(sessionId: string, _userId: string, transcript?: string) {
    // Basic implementation for summary
    const prompt = transcript 
      ? `Summarize this tutoring session transcript:\n\n${transcript}\n\nOutput a JSON object with: summary, keyTopics (array), actionItems (array), studyRecommendations (array).`
      : `Generate a generic session summary template for session ${sessionId}. Output a JSON object with: summary, keyTopics (array), actionItems (array), studyRecommendations (array).`;

    const completion = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const content = completion.text;
    if (!content) throw new BadRequestError('Failed to generate summary');
    
    return JSON.parse(content);
  }

  async createStudyRoadmap(subject: string, currentLevel: string, targetLevel: string, availableHoursPerWeek: number) {
    const prompt = `Create a study roadmap for ${subject} from ${currentLevel} to ${targetLevel} with ${availableHoursPerWeek} hours/week.
Output STRICTLY as a JSON object matching this schema:
{
  "roadmap": [
    {
      "week": 1,
      "topics": ["topic1", "topic2"],
      "resources": ["resource1", "resource2"],
      "milestones": ["milestone1"]
    }
  ]
}`;

    const completion = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const content = completion.text;
    if (!content) throw new BadRequestError('Failed to generate roadmap');
    
    return JSON.parse(content);
  }
}

export const aiService = new AIService();
