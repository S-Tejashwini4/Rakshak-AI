import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TimelineEvent {
  id: string | number;
  caseId: string; // Add caseId to link events to cases
  date: string;
  time: string;
  title: string;
  type: 'document' | 'video' | 'alert' | 'image' | 'action';
  desc: string;
  iconName: string;
  color: string;
  bg: string;
}

interface TimelineState {
  events: TimelineEvent[];
  addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  resetEvents: () => void;
}

const INITIAL_EVENTS: TimelineEvent[] = [];

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set) => ({
      events: INITIAL_EVENTS,
      addEvent: (event) => set((state) => ({
        events: [...state.events, { ...event, id: Date.now() }]
      })),
      resetEvents: () => set({ events: INITIAL_EVENTS }),
    }),
    {
      name: 'rakshak-timeline-store',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return { ...persistedState, events: INITIAL_EVENTS };
        }
        return persistedState;
      }
    }
  )
);
