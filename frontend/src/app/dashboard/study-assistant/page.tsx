'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStreamingChat } from '../../../hooks/useStreamingChat';
import { StreamingMessage } from '../../../components/ui/StreamingMessage';
import { QuizWidget, type QuizQuestion } from '../../../components/ui/QuizWidget';
import { Button, Input, Card } from '@/components/ui';
import { Send, Loader2, Sparkles, BookOpen } from 'lucide-react';

export default function StudyAssistantPage() {
  const [conversationId] = useState(() => Date.now().toString());
  const { messages, isTyping, error, sendMessage } = useStreamingChat(conversationId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const subjectContext = 'Mathematics'; // Mock context

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    sendMessage(input, { subject: subjectContext });
    setInput('');
  };

  // Mock initial quiz generation to demonstrate capability
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const generateQuiz = async () => {
    // In a real flow, this calls our non-streaming quiz endpoint
    setQuiz([
      {
        question: "What is the derivative of e^x?",
        options: ["e^x", "x*e^(x-1)", "ln(x)", "1/x"],
        answer: 0,
        explanation: "The derivative of the natural exponential function e^x is itself."
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            AI Study Assistant
          </h1>
          <p className="text-muted-foreground mt-1">Your 24/7 personal tutor for all subjects.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateQuiz}>
            <BookOpen className="w-4 h-4 mr-2" />
            Generate Quiz
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col bg-background/50 backdrop-blur-sm border-border shadow-sm">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !quiz && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 text-muted-foreground">
              <Sparkles className="w-12 h-12 opacity-20" />
              <h2 className="text-xl font-semibold text-foreground">How can I help you today?</h2>
              <p>Ask me to explain a concept, help you solve a problem, or create a study plan.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={() => setInput("Explain quantum mechanics simply")}>Explain a concept</Button>
                <Button variant="secondary" size="sm" onClick={() => setInput("Help me write a study plan for finals")}>Create study plan</Button>
              </div>
            </div>
          )}

          {quiz && (
            <div className="flex justify-center">
              <QuizWidget questions={quiz} title={`Practice: ${subjectContext}`} />
            </div>
          )}

          {messages.map((msg) => (
            <StreamingMessage key={msg.id} role={msg.role} content={msg.content} />
          ))}

          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-muted rounded-lg p-4 flex gap-1 items-center h-12">
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            </div>
          )}

          {error && (
            <div className="text-destructive text-center p-2 rounded-md bg-destructive/10 border border-destructive/20">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="p-4 bg-card border-t border-border">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${subjectContext}...`}
              className="flex-1 bg-background"
              disabled={isTyping}
            />
            <Button type="submit" disabled={!input.trim() || isTyping}>
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
          <div className="text-center mt-2 text-xs text-muted-foreground">
            AI can make mistakes. Verify important information.
          </div>
        </div>
      </Card>
    </div>
  );
}
