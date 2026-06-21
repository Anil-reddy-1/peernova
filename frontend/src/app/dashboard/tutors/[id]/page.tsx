'use client';

import { useState } from 'react';
import { useTutorProfile, useTutorAvailability } from '@/hooks/useTutors';
import { useAuth } from '@/lib/auth-context';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';
import { Star, MessageSquare, BookOpen, Clock, Calendar, CheckCircle2, IndianRupee, MapPin, GraduationCap, ShieldCheck, Flag } from 'lucide-react';


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

  const reportMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason: string }) => {
      return apiClient.post(`/users/${id}/report`, { reason });
    },
    onSuccess: () => {
      showToast('success', 'User reported successfully');
    },
    onError: () => {
      showToast('error', 'Failed to report user');
    }
  });

  const handleReport = () => {
    const reason = prompt('Enter reason for reporting this tutor:');
    if (reason) {
      reportMutation.mutate({ id, reason });
    }
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
    <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-fade-in">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-900/30"></div>
        <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-surface-500 font-medium">Loading tutor profile...</p>
    </div>
  );
  
  if (!tutor) return (
    <div className="flex flex-col items-center justify-center py-32 animate-fade-up">
      <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
        <span className="text-4xl">😕</span>
      </div>
      <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Tutor not found</h2>
      <p className="text-surface-500">The tutor you are looking for does not exist or is no longer available.</p>
      <button onClick={() => router.push('/dashboard/tutors')} className="mt-8 btn-primary">
        Browse other tutors
      </button>
    </div>
  );

  const displayName = (tutor as any).displayName || 'Tutor';
  const photoURL = (tutor as any).photoURL;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-6xl mx-auto animate-fade-up pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-medium transition-all animate-fade-in ${
          toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          <span className="bg-white/20 rounded-full p-1">
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <span className="px-2">✕</span>}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="h-48 md:h-64 rounded-3xl bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-blue-500/20 dark:from-primary-900/40 dark:via-purple-900/40 dark:to-blue-900/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary-500/30 blur-3xl rounded-full"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/30 blur-3xl rounded-full"></div>
      </div>

      <div className="px-4 sm:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Card */}
            <div className="glass-card rounded-3xl p-8 shadow-lg border border-white/20 dark:border-white/5 backdrop-blur-xl relative">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-20 mb-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-white dark:bg-surface-800 shadow-xl border-4 border-white dark:border-surface-900 flex items-center justify-center text-5xl shrink-0 overflow-hidden relative z-10 transition-transform duration-300 group-hover:scale-105">
                    {photoURL ? (
                      <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-primary-500">{avatarInitial}</span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white tracking-tight">{displayName}</h1>
                    {(tutor as any).isVerified && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-surface-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-5 h-5 text-warning-500 fill-warning-500" />
                      <span className="text-surface-900 dark:text-white font-bold">{tutor.rating > 0 ? tutor.rating.toFixed(1) : 'New'}</span>
                      <span>({tutor.reviewCount || 0} reviews)</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-surface-300 dark:bg-surface-700"></div>
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4" />
                      <span className="text-surface-900 dark:text-white font-bold">{tutor.hourlyRate}</span>/hr
                    </div>
                  </div>
                </div>
                
                <div className="pb-1 w-full sm:w-auto flex flex-col sm:flex-row gap-3">

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
                    className="w-full sm:w-auto btn-secondary gap-2 shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </button>

                  <button
                    onClick={handleReport}
                    className="w-full sm:w-auto px-4 py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-3 text-surface-900 dark:text-white">
                    <BookOpen className="w-5 h-5 text-primary-500" />
                    Subjects
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tutor.subjects?.map((sub: any) => (
                      <span key={sub.name} className="px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 rounded-xl text-sm font-semibold border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-default">
                        {sub.name} <span className="opacity-50 ml-1 font-normal text-xs uppercase">{sub.level}</span>
                      </span>
                    ))}
                    {(!tutor.subjects || tutor.subjects.length === 0) && (
                      <span className="text-surface-500 italic text-sm">General subjects</span>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-surface-200 dark:via-surface-700 to-transparent"></div>

                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-3 text-surface-900 dark:text-white">
                    <GraduationCap className="w-5 h-5 text-primary-500" />
                    About me
                  </h3>
                  <p className="text-surface-600 dark:text-surface-300 leading-relaxed text-[15px] whitespace-pre-wrap">
                    {tutor.bio || "This tutor hasn't written a bio yet."}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Reviews Section Placeholder */}
            <div className="glass-card rounded-3xl p-8 shadow-sm">
              <h3 className="text-xl font-bold mb-6 text-surface-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-warning-500" />
                Student Reviews
              </h3>
              {tutor.reviewCount > 0 ? (
                <div className="text-surface-500 italic">Reviews will appear here.</div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-surface-300 dark:text-surface-600" />
                  </div>
                  <p className="text-surface-500 font-medium">No reviews yet.</p>
                  <p className="text-sm text-surface-400 mt-1">Be the first to review after taking a session!</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Column (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {role === 'student' ? (
                <div className="glass-card rounded-3xl p-6 shadow-xl border border-primary-500/20 bg-gradient-to-b from-white to-surface-50 dark:from-surface-900 dark:to-surface-800/80">
                  <h2 className="text-xl font-bold mb-6 text-surface-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    Book a Session
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">What do you want to learn?</label>
                      <input
                        type="text"
                        placeholder="e.g. Calculus, React, Physics..."
                        className={`input w-full bg-white dark:bg-surface-900 shadow-sm ${validationError && !subject ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                        value={subject}
                        onChange={(e) => { setSubject(e.target.value); setValidationError(null); }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300">Select a Slot</label>
                        <span className="text-xs font-medium text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-md">
                          {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </span>
                      </div>
                      
                      {isAvailabilityLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700 border-dashed">
                          <div className="animate-spin w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent" />
                          <span className="text-sm text-surface-500 font-medium">Loading slots...</span>
                        </div>
                      ) : !availability?.length ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700 border-dashed">
                          <Clock className="w-8 h-8 text-surface-300 dark:text-surface-600 mb-2" />
                          <p className="text-sm text-surface-500 font-medium px-4">No upcoming slots available right now.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {availability?.map((slot: any) => {
                            const start = new Date(slot.startTime);
                            const end = new Date(slot.endTime);
                            const isSelected = selectedSlot === slot.id;
                            
                            // Format: "Today", "Tomorrow", or "Mon, 12 Jun"
                            const today = new Date();
                            const tomorrow = new Date(today);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            
                            let dayLabel = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                            if (start.toDateString() === today.toDateString()) dayLabel = 'Today';
                            else if (start.toDateString() === tomorrow.toDateString()) dayLabel = 'Tomorrow';

                            return (
                              <button
                                key={slot.id}
                                onClick={() => { setSelectedSlot(slot.id); setValidationError(null); }}
                                className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 group flex items-center justify-between ${
                                  isSelected
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-sm ring-1 ring-primary-500/50'
                                    : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 hover:border-primary-300 hover:shadow-sm'
                                }`}
                              >
                                <div>
                                  <div className={`font-bold text-sm mb-0.5 ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'}`}>
                                    {dayLabel}
                                  </div>
                                  <div className={`text-sm font-medium ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-400'}`}>
                                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                    {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-surface-300 dark:border-surface-600 group-hover:border-primary-400'}`}>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Inline validation error */}
                    {validationError && (
                      <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                        <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                          <span className="bg-red-100 dark:bg-red-500/20 rounded-full w-5 h-5 flex items-center justify-center text-xs">!</span> 
                          {validationError}
                        </p>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        className="btn-primary w-full py-3.5 text-base font-bold shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
                        onClick={handleBook}
                        disabled={isBooking || !selectedSlot || !subject}
                      >
                        {isBooking ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Booking...
                          </>
                        ) : (
                          <>
                            Proceed to Checkout
                            <span className="text-primary-100">→</span>
                          </>
                        )}
                      </button>
                      <p className="text-center text-xs font-medium text-surface-400 mt-3 flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        Secure booking with PeerNova
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-800 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-surface-400" />
                  </div>
                  <h3 className="font-bold text-surface-900 dark:text-white mb-2">Student View</h3>
                  <p className="text-sm text-surface-500 mb-4">You are viewing this profile as a tutor. Switch to a student account to book sessions.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Required empty placeholder for Lucide Icon to avoid unused var warning if any */}
      <div className="hidden">
        <MapPin />
      </div>
    </div>
  );
}
