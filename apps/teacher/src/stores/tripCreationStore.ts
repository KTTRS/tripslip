import { create } from 'zustand';
import type { Tables } from '@tripslip/database';

type Experience = Tables<'experiences'>;
type Student = Tables<'students'>;

export interface TripDetails {
  name: string;
  date: string;
  time: string;
  description: string;
}

export interface TripCreationState {
  // Current step (1-4)
  currentStep: number;
  
  // Step 1: Trip Details
  tripDetails: TripDetails | null;
  
  // Step 2: Experience Selection
  selectedExperience: Experience | null;
  
  // Step 3: Student Selection
  selectedStudents: Student[];
  
  // Draft management
  isDraft: boolean;
  draftId: string | null;
  
  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  setTripDetails: (details: TripDetails) => void;
  setSelectedExperience: (experience: Experience) => void;
  setSelectedStudents: (students: Student[]) => void;
  
  saveDraft: () => Promise<void>;
  loadDraft: (draftId: string) => Promise<void>;
  
  reset: () => void;
}

export const useTripCreationStore = create<TripCreationState>((set, get) => ({
  currentStep: 1,
  tripDetails: null,
  selectedExperience: null,
  selectedStudents: [],
  isDraft: false,
  draftId: null,
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  nextStep: () => set((state) => ({ 
    currentStep: Math.min(state.currentStep + 1, 4) 
  })),
  
  prevStep: () => set((state) => ({ 
    currentStep: Math.max(state.currentStep - 1, 1) 
  })),
  
  setTripDetails: (details) => set({ tripDetails: details }),
  
  setSelectedExperience: (experience) => set({ selectedExperience: experience }),
  
  setSelectedStudents: (students) => set({ selectedStudents: students }),
  
  saveDraft: async () => {
    // TODO: Implement draft saving to database
    const state = get();
    console.log('Saving draft:', state);
    set({ isDraft: true });
  },
  
  loadDraft: async (draftId) => {
    // TODO: Implement draft loading from database
    console.log('Loading draft:', draftId);
  },
  
  reset: () => set({
    currentStep: 1,
    tripDetails: null,
    selectedExperience: null,
    selectedStudents: [],
    isDraft: false,
    draftId: null,
  }),
}));
