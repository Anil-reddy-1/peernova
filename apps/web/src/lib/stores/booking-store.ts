import { create } from 'zustand';

interface BookingState {
  selectedTutorId: string | null;
  selectedDate: Date | null;
  selectedTimeSlot: string | null;
  setTutorId: (id: string | null) => void;
  setDate: (date: Date | null) => void;
  setTimeSlot: (slot: string | null) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedTutorId: null,
  selectedDate: null,
  selectedTimeSlot: null,
  setTutorId: (id) => set({ selectedTutorId: id }),
  setDate: (date) => set({ selectedDate: date }),
  setTimeSlot: (slot) => set({ selectedTimeSlot: slot }),
  resetBooking: () => set({ selectedTutorId: null, selectedDate: null, selectedTimeSlot: null }),
}));
