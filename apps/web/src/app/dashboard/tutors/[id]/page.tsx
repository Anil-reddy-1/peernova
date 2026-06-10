'use client';

import { useState } from 'react';
import { useTutorProfile, useTutorAvailability } from '@/hooks/useTutors';
import { useAuth } from '@/lib/auth-context';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function TutorProfilePage() {
  const { id } = useParams() as { id: string };
  const { data: tutor, isLoading: isTutorLoading } = useTutorProfile(id);
  const { data: availability, isLoading: isAvailabilityLoading } = useTutorAvailability(id);
  const { role } = useAuth();
  const router = useRouter();

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const handleBook = async () => {
    if (!selectedSlot || !subject) return alert('Please select a slot and enter a subject');
    try {
      setIsBooking(true);
      await apiClient.post('/v1/sessions', {
        tutorId: id,
        slotId: selectedSlot,
        subject,
        recordingConsent: true
      });

      // Redirect to Razorpay checkout or confirmation page
      // In a real app we'd trigger the Razorpay script here using data.data.razorpayOrderId
      alert('Booking initiated! Redirecting to sessions...');
      router.push('/sessions');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to book session');
    } finally {
      setIsBooking(false);
    }
  };

  if (isTutorLoading) return <div className="p-8">Loading profile...</div>;
  if (!tutor) return <div className="p-8 text-red-500">Tutor not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      {/* Profile Header */}
      <div className="glass-card rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-24 h-24 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center text-4xl shrink-0">
          {(tutor as any).displayName?.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{(tutor as any).displayName}</h1>
          <p className="text-surface-600 mb-4">{tutor.bio}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {tutor.subjects?.map((sub: any) => (
              <span key={sub.name} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {sub.name} ({sub.level})
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium mb-6">
            <div className="flex items-center gap-1">
              <span>⭐</span>
              <span>{tutor.rating?.toFixed(1) || 'N/A'}</span>
            </div>
            <div>{tutor.reviewCount || 0} Reviews</div>
            <div className="text-lg">₹{tutor.hourlyRate}/hr</div>
          </div>
          <button 
            onClick={async () => {
              try {
                const res = await apiClient.post('/v1/chat/rooms', { participantId: id, initialMessage: 'Hi' });
                router.push(`/dashboard/messages?chatId=${res.data.data.id}`);
              } catch(err) {
                console.error('Failed to create chat', err);
                router.push('/dashboard/messages');
              }
            }}
            className="btn-secondary px-6"
          >
            Message Tutor
          </button>
        </div>
      </div>

      {/* Booking Section */}
      {role === 'student' && (
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6">Book a Session</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Subject</label>
              <input 
                type="text" 
                placeholder="What do you want to learn?" 
                className="input max-w-md"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Available Slots</label>
              {isAvailabilityLoading ? (
                <div>Loading slots...</div>
              ) : availability?.length === 0 ? (
                <div className="text-surface-500">No availability slots right now.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {availability?.map((slot: any) => {
                    const start = new Date(slot.startTime);
                    const end = new Date(slot.endTime);
                    const isSelected = selectedSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`p-4 rounded-xl border text-left transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/10' 
                            : 'border-surface-200 dark:border-surface-800 hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">
                          {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm text-surface-500 mt-1">
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <button 
              className="btn-primary" 
              onClick={handleBook}
              disabled={isBooking || !selectedSlot || !subject}
            >
              {isBooking ? 'Booking...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
