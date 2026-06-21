'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

import { Spinner, EmptyState, Button, Card } from '@/components/ui';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();

  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const { data: sessionData, isLoading, isError } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const res = await api.sessions.getById(sessionId);
      return res.data;
    },
    enabled: !!sessionId,
  });

  const session = (sessionData as any)?.data;

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Direct Mock Payment for Session
      await api.sessions.confirmPayment(sessionId, `mock_payment_${Date.now()}`);

      setPaymentStatus('success');
      setTimeout(() => {
        router.push('/dashboard/sessions');
      }, 3000);
    } catch (error) {
      console.error('Payment failed', error);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="py-20 flex justify-center"><Spinner className="w-8 h-8 text-primary" /></div>;
  if (isError || !session) return <EmptyState icon={AlertCircle} title="Session not found" description="The session you are trying to pay for does not exist or has been cancelled." />;

  if (paymentStatus === 'success') {
    return (
      <div className="max-w-md mx-auto mt-20 text-center animate-fade-up">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-surface-500 mb-8">Your session is now confirmed. Redirecting to your sessions...</p>
        <Button onClick={() => router.push('/dashboard/sessions')} className="w-full">
          View My Sessions
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-up pt-12">
      <div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Checkout</h1>
        <p className="text-surface-500">Review your session details and complete the payment.</p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-surface-200 dark:border-surface-800">
              <div>
                <p className="font-medium text-surface-900 dark:text-white">{session.subject}</p>
                <p className="text-sm text-surface-500">with {(session.tutor as any)?.displayName || 'Tutor'}</p>
              </div>
              <p className="font-semibold text-surface-900 dark:text-white">₹{session.price || 0}</p>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b border-surface-200 dark:border-surface-800">
              <p className="text-surface-600 dark:text-surface-400">Platform Fee (10%)</p>
              <p className="font-medium text-surface-900 dark:text-white">₹{Math.round((session.price || 0) * 0.1)}</p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-lg font-bold text-surface-900 dark:text-white">Total</p>
              <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                ₹{Math.round((session.price || 0) * 1.1)}
              </p>
            </div>
          </div>
        </div>

        {paymentStatus === 'failed' && (
          <div className="p-4 bg-error/10 text-error rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">Payment failed or was cancelled. Please try again.</p>
          </div>
        )}

        <Button 
          onClick={handlePayment} 
          disabled={isProcessing} 
          className="w-full py-6 text-lg rounded-xl"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Spinner className="w-5 h-5" /> Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Pay ₹{Math.round((session.price || 0) * 1.1)}
            </span>
          )}
        </Button>
      </Card>
    </div>
  );
}
