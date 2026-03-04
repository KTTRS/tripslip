import { create } from 'zustand';
import type { Tables } from '@tripslip/database';
import { logger } from '@tripslip/utils';
import { supabase } from '../lib/supabase';

type Experience = Tables<'experiences'>;
type Student = Tables<'students'>;

export interface VenueInfo {
  id: string;
  name: string;
  address: any;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
}

export interface VenueForm {
  id: string;
  name: string;
  category: string;
  file_url: string;
  required: boolean;
}

export interface TripDetails {
  name: string;
  date: string;
  time: string;
  description: string;
  specialRequirements?: string;
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
  
  // Venue integration (pre-populated from venue listing)
  venueInfo: VenueInfo | null;
  venueForms: VenueForm[];
  
  // Draft management
  isDraft: boolean;
  draftId: string | null;
  lastSaved: Date | null;
  teacherId: string | null;
  
  // Actions
  setTeacherId: (id: string | null) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  setTripDetails: (details: TripDetails) => void;
  setSelectedExperience: (experience: Experience) => void;
  setSelectedStudents: (students: Student[]) => void;
  setVenueInfo: (venue: VenueInfo | null) => void;
  setVenueForms: (forms: VenueForm[]) => void;
  
  // Pre-populate from venue/experience
  prePopulateFromVenue: (venue: VenueInfo, experience: Experience, forms: VenueForm[]) => void;
  
  saveDraft: () => Promise<void>;
  loadDraft: (teacherId: string) => Promise<void>;
  clearDraft: (teacherId: string) => Promise<void>;
  
  reset: () => void;
}

export const useTripCreationStore = create<TripCreationState>((set, get) => ({
  currentStep: 1,
  tripDetails: null,
  selectedExperience: null,
  selectedStudents: [],
  venueInfo: null,
  venueForms: [],
  isDraft: false,
  draftId: null,
  lastSaved: null,
  teacherId: null,
  
  setTeacherId: (id) => set({ teacherId: id }),
  
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
  
  setVenueInfo: (venue) => set({ venueInfo: venue }),
  
  setVenueForms: (forms) => set({ venueForms: forms }),
  
  prePopulateFromVenue: (venue, experience, forms) => set({
    venueInfo: venue,
    selectedExperience: experience,
    venueForms: forms,
    tripDetails: {
      name: `${venue.name} - ${experience.title}`,
      date: '',
      time: experience.event_time || '',
      description: experience.description || '',
      specialRequirements: '',
    },
  }),
  
  saveDraft: async () => {
    const state = get();
    const teacherId = state.teacherId;
    
    if (!teacherId) {
      logger.warn('Cannot save draft: no teacher ID');
      return;
    }
    
    try {
      const draftData = {
        currentStep: state.currentStep,
        tripDetails: state.tripDetails,
        selectedExperience: state.selectedExperience,
        selectedStudents: state.selectedStudents,
        venueInfo: state.venueInfo,
        venueForms: state.venueForms,
      };

      const { data, error } = await supabase
        .from('trip_drafts')
        .upsert({
          teacher_id: teacherId,
          draft_data: draftData,
          last_saved_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      set({ 
        isDraft: true, 
        draftId: data.id,
        lastSaved: new Date() 
      });
      
      logger.info('Draft saved successfully', { draftId: data.id });
    } catch (error) {
      logger.error('Failed to save draft', error as Error);
      throw error;
    }
  },
  
  loadDraft: async (teacherId: string) => {
    try {
      const { data, error } = await supabase
        .from('trip_drafts')
        .select('*')
        .eq('teacher_id', teacherId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No draft found - this is not an error
          logger.debug('No draft found for teacher', { teacherId });
          return;
        }
        throw error;
      }
      
      const draft = data.draft_data as any;
      
      set({
        currentStep: draft.currentStep || 1,
        tripDetails: draft.tripDetails || null,
        selectedExperience: draft.selectedExperience || null,
        selectedStudents: draft.selectedStudents || [],
        venueInfo: draft.venueInfo || null,
        venueForms: draft.venueForms || [],
        isDraft: true,
        draftId: data.id,
        lastSaved: new Date(data.last_saved_at),
        teacherId,
      });
      
      logger.info('Draft loaded successfully', { draftId: data.id });
    } catch (error) {
      logger.error('Failed to load draft', error as Error);
      throw error;
    }
  },

  clearDraft: async (teacherId: string) => {
    try {
      const { error } = await supabase
        .from('trip_drafts')
        .delete()
        .eq('teacher_id', teacherId);
      
      if (error) throw error;
      
      set({ 
        isDraft: false, 
        draftId: null,
        lastSaved: null 
      });
      
      logger.info('Draft cleared successfully');
    } catch (error) {
      logger.error('Failed to clear draft', error as Error);
    }
  },
  
  reset: () => set({
    currentStep: 1,
    tripDetails: null,
    selectedExperience: null,
    selectedStudents: [],
    venueInfo: null,
    venueForms: [],
    isDraft: false,
    draftId: null,
    lastSaved: null,
  }),
}));
