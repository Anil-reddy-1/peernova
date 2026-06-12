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
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleBook = async () => {
    if (!selectedSlot || !subject.trim()) {
      setValidationError('Please select a slot and enter a subject.');
      return;
    }
    setValidationError(null);
    try {
      setIsBooking(true);
      await apiClient.post('/sessions', {
        tutorId: id,
        slotId: selectedSlot,
        subject,
        recordingConsent: true
      });

      showToast('success', 'Session booked! Redirecting to sessions...');
      setTimeout(() => router.push('/dashboard/sessions'), 1500);
    } catch (error: any) {
      showToast('error', error.response?.data?.error?.message || 'Failed to book session. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  if (isTutorLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="animate-spin w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>
  );
  if (!tutor) return <div className="p-8 text-red-500">Tutor not found</div>;

  const displayName = (tutor as any).displayName || 'Tutor';
  const photoURL = (tutor as any).photoURL;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg text-white font-medium transition-all animate-fade-in ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="glass-card rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-24 h-24 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center text-4xl shrink-0 overflow-hidden">
          {photoURL ? (
            <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span>{avatarInitial}</span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
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
                const res = await apiClient.post('/chat/rooms', { participantId: id, initialMessage: 'Hi' });
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
                className={`input max-w-md ${validationError && !subject ? 'border-red-500' : ''}`}
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setValidationError(null); }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Available Slots</label>
              {isAvailabilityLoading ? (
                <div className="flex items-center gap-2 text-surface-500">
                  <div className="animate-spin w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent" />
                  Loading slots...
                </div>
              ) : !availability?.length ? (
                <div className="text-surface-500 py-4">No availability slots right now.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {availability?.map((slot: any) => {
                    const start = new Date(slot.startTime);
                    const end = new Date(slot.endTime);
                    const isSelected = selectedSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => { setSelectedSlot(slot.id); setValidationError(null); }}
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
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Inline validation error */}
            {validationError && (
              <p className="text-red-600 text-sm flex items-center gap-1">
                <span>⚠</span> {validationError}
              </p>
            )}

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
