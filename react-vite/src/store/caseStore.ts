import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { useAuthStore } from './authStore';
import { useMemo } from 'react';
import { INVESTIGATOR_CASES } from '../utils/mockData';

const syncCasesToBackend = async (cases: any[]) => {
  try {
    await axios.put('/server/rakshak_function/api/ui/cases', cases);
  } catch (error) {
    console.error('Failed to sync cases to backend', error);
  }
};

interface CaseStore {
  cases: any[];
  setCases: (cases: any[]) => void;
  addCase: (newCase: any) => void;
  removeCase: (id: string) => void;
  updateCase: (id: string, updates: any) => void;
  fetchCases: () => Promise<void>;
}

export const useCaseStore = create<CaseStore>()(
  persist(
    (set, get) => ({
      cases: INVESTIGATOR_CASES,
      setCases: (cases) => set({ cases }),
      addCase: (newCase) => {
        set((state) => {
          const newCases = [newCase, ...state.cases];
          syncCasesToBackend(newCases);
          return { cases: newCases };
        });
      },
      removeCase: (id) => {
        set((state) => {
          const newCases = state.cases.filter((c: any) => c.id !== id);
          syncCasesToBackend(newCases);
          return { cases: newCases };
        });
      },
      updateCase: (id, updates) => {
        set((state) => {
          const newCases = state.cases.map(c => c.id === id ? { ...c, ...updates } : c);
          syncCasesToBackend(newCases);
          return { cases: newCases };
        });
      },
      fetchCases: async () => {
        try {
          const res = await axios.get('/server/rakshak_function/api/ui/cases');
          if (res.data && Array.isArray(res.data)) {
            if (res.data.length > 0) {
              set((state) => {
                // Merge backend cases with local cases
                const localCases = state.cases;
                const merged = [...localCases];
                res.data.forEach((backendCase: any) => {
                  if (!merged.find(c => c.id === backendCase.id)) {
                    merged.push(backendCase);
                  }
                });
                return { cases: merged };
              });
            }
          }
        } catch (error) {
          console.error('Failed to fetch cases from backend', error);
        }
      }
    }),
    {
      name: 'rakshak-case-store',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return { ...persistedState, cases: INVESTIGATOR_CASES };
        }
        return persistedState;
      }
    }
  )
);

export const useAssignedCases = () => {
  const cases = useCaseStore(state => state.cases);
  const { user, role } = useAuthStore();
  
  return useMemo(() => {
    if (role === 'Super Admin' || role === 'Supervisor' || role === 'Desk Officer') {
      return cases;
    }
    return cases.filter((c: any) => 
      c.assignee && 
      user?.name && 
      c.assignee.toLowerCase().includes(user.name.toLowerCase().replace('officer ', '').trim())
    );
  }, [cases, user, role]);
};
