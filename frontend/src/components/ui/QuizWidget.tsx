import React, { useState } from 'react';
import { Button, Card } from '@/components/ui';
const CardContent = ({ children, className }: any) => <div className={className}>{children}</div>;
const CardFooter = ({ children, className }: any) => <div className={className}>{children}</div>;
const CardHeader = ({ children, className }: any) => <div className={className}>{children}</div>;
const CardTitle = ({ children, className }: any) => <div className={`font-semibold ${className}`}>{children}</div>;
import { CheckCircle, XCircle } from 'lucide-react';

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface QuizWidgetProps {
  questions: QuizQuestion[];
  title?: string;
}

export function QuizWidget({ questions, title = 'Practice Quiz' }: QuizWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === currentQ.answer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setShowResult(false);
    setCurrentIndex(i => i + 1);
  };

  if (isFinished) {
    return (
      <Card className="w-full max-w-lg my-4 bg-card">
        <CardHeader>
          <CardTitle>Quiz Completed</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-4xl font-bold text-primary mb-2">
            {score} / {questions.length}
          </p>
          <p className="text-muted-foreground">Great job practicing!</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => { setCurrentIndex(0); setScore(0); }}>
            Retake Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg my-4 bg-card border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
          <span>{title}</span>
          <span>Question {currentIndex + 1} of {questions.length}</span>
        </div>
        <CardTitle className="text-lg leading-snug">{currentQ.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentQ.options.map((opt, idx) => {
          let stateClass = 'hover:border-primary cursor-pointer border-border';
          if (showResult) {
            if (idx === currentQ.answer) {
              stateClass = 'bg-green-500/10 border-green-500 text-green-700 dark:text-green-400';
            } else if (idx === selected) {
              stateClass = 'bg-destructive/10 border-destructive text-destructive';
            } else {
              stateClass = 'opacity-50 border-border';
            }
          }

          return (
            <div
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`p-3 border rounded-lg transition-all ${stateClass} flex items-center justify-between`}
            >
              <span>{opt}</span>
              {showResult && idx === currentQ.answer && <CheckCircle className="w-5 h-5 text-green-500" />}
              {showResult && idx === selected && idx !== currentQ.answer && <XCircle className="w-5 h-5 text-destructive" />}
            </div>
          );
        })}

        {showResult && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm border">
            <span className="font-semibold block mb-1">Explanation:</span>
            {currentQ.explanation}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end pt-0">
        {showResult && (
          <Button onClick={handleNext}>
            {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
