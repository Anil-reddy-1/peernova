'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Spinner, Button, EmptyState } from '@peer-tutoring/ui';
import { Calendar, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { format, addDays, startOfDay, parse, isBefore, isToday } from 'date-fns';

// Inline notification banner (replaces browser alert())
function Banner({ type, message, onDismiss }: { type: 'error' | 'success', message: string, onDismiss: () => void }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl mb-4 border text-sm font-medium ${
      type === 'error'
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
    }`}>
      {type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// Round current time to the next 30-min boundary and return HH:mm
function getDefaultStartTime(): string {
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
  if (now.getMinutes() >= 60) { now.setHours(now.getHours() + 1, 0, 0, 0); }
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getDefaultEndTime(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const end = new Date();
  end.setHours(h + 1, m, 0, 0);
  return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
}

export default function AvailabilityPage() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const defaultStart = getDefaultStartTime();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(getDefaultEndTime(defaultStart));
  const [banner, setBanner] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  // Fetch slots
  const { data: slotsRes, isLoading } = useQuery({
    queryKey: ['availability', userProfile?.id],
    queryFn: async () => {
      const res = await api.tutors.getAvailability(userProfile!.id);
      return res.data;
    },
    enabled: !!userProfile?.id,
  });

  const slots = (slotsRes as any)?.data || [];

  // Add slot mutation
  const addSlotMutation = useMutation({
    mutationFn: async () => {
      const start = parse(startTime, 'HH:mm', selectedDate);
      const end = parse(endTime, 'HH:mm', selectedDate);
      const now = new Date();

      // Client-side validation: block past times
      if (isBefore(start, now)) {
        throw new Error('Start time must be in the future. Please select a later time.');
      }
      if (isBefore(end, start) || end.getTime() === start.getTime()) {
        throw new Error('End time must be after start time.');
      }

      return api.tutors.createAvailability({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      setBanner({ type: 'success', message: 'Slot added successfully!' });
    },
    onError: (err: any) => {
      const msg = err.message || err.response?.data?.error?.message || 'Failed to add slot. Please try again.';
      setBanner({ type: 'error', message: msg });
    }
  });

  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      return api.tutors.deleteAvailability(slotId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
    onError: () => {
      setBanner({ type: 'error', message: 'Failed to delete slot. Please try again.' });
    }
  });

  // Next 7 days for selection
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startOfDay(new Date()), i));

  // Filter slots for selected date
  const selectedDateSlots = slots.filter((slot: any) => {
    const slotDate = startOfDay(new Date(slot.startTime));
    return slotDate.getTime() === selectedDate.getTime();
  }).sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Auto-update end time when start time changes
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    setEndTime(getDefaultEndTime(newStart));
    setBanner(null);
  };

  // When user picks a day, set smart defaults for today vs future days
  const handleDaySelect = (day: Date) => {
    setSelectedDate(day);
    setBanner(null);
    if (isToday(day)) {
      const smart = getDefaultStartTime();
      setStartTime(smart);
      setEndTime(getDefaultEndTime(smart));
    } else {
      setStartTime('09:00');
      setEndTime('10:00');
    }
  };

  return (
    <div className="animate-fade-up max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Availability</h1>
          <p className="text-surface-500 mt-1">Manage your tutoring schedule and available slots.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 flex flex-col md:flex-row">
        
        {/* Days Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-950/50">
          <div className="p-4 border-b border-surface-200 dark:border-surface-800">
            <h2 className="font-semibold text-surface-900 dark:text-white">Upcoming Days</h2>
          </div>
          <div className="flex overflow-x-auto md:flex-col">
            {days.map((day) => {
              const isSelected = day.getTime() === selectedDate.getTime();
              const daySlots = slots.filter((s: any) => startOfDay(new Date(s.startTime)).getTime() === day.getTime());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDaySelect(day)}
                  className={`flex items-center justify-between px-4 py-4 min-w-[140px] md:min-w-0 transition-colors border-b border-surface-100 dark:border-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 ${
                    isSelected ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium' : 'text-surface-600 dark:text-surface-400'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-sm font-bold">{format(day, 'MMM d')}</div>
                    <div className="text-xs opacity-80">{format(day, 'EEEE')}</div>
                  </div>
                  {daySlots.length > 0 && (
                    <span className="text-xs bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300 px-2 py-0.5 rounded-full">
                      {daySlots.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots Area */}
        <div className="flex-1 p-6 bg-white dark:bg-surface-950">
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-4">
            Slots for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            {isToday(selectedDate) && (
              <span className="ml-2 text-xs font-normal text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-full">Today</span>
            )}
          </h2>

          {/* Banner replaces alert() */}
          {banner && (
            <Banner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />
          )}

          {/* Add Slot Form */}
          <div className="flex gap-4 items-end mb-8 bg-surface-50 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setBanner(null); }}
                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800"
              />
            </div>
            <Button
              onClick={() => addSlotMutation.mutate()}
              disabled={addSlotMutation.isPending}
            >
              {addSlotMutation.isPending ? 'Adding...' : 'Add Slot'}
            </Button>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center"><Spinner /></div>
          ) : selectedDateSlots.length === 0 ? (
            <EmptyState icon={Calendar} title="No slots" description="You have no availability slots set for this day." />
          ) : (
            <div className="space-y-3">
              {selectedDateSlots.map((slot: any) => (
                <div key={slot.id} className="flex justify-between items-center p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                  <div className="font-medium">
                    {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${slot.isBooked ? 'bg-primary-100 text-primary-700' : 'bg-success/10 text-success'}`}>
                      {slot.isBooked ? 'Booked' : 'Available'}
                    </span>
                    {!slot.isBooked && (
                      <button
                        onClick={() => deleteSlotMutation.mutate(slot.id)}
                        disabled={deleteSlotMutation.isPending}
                        className="p-2 text-surface-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
