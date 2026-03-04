import { describe, it, expect, beforeEach } from 'vitest';
import { useTripCreationStore } from '../tripCreationStore';
import type { VenueInfo, VenueForm } from '../tripCreationStore';

describe('TripCreationStore - Venue Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    useTripCreationStore.getState().reset();
  });

  it('should initialize with empty venue info', () => {
    const state = useTripCreationStore.getState();
    expect(state.venueInfo).toBeNull();
    expect(state.venueForms).toEqual([]);
  });

  it('should set venue info', () => {
    const venueInfo: VenueInfo = {
      id: 'venue-1',
      name: 'Science Museum',
      address: {
        street: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
      },
      contact_email: 'info@sciencemuseum.org',
      contact_phone: '555-0100',
      website: 'https://sciencemuseum.org',
    };

    useTripCreationStore.getState().setVenueInfo(venueInfo);
    
    const state = useTripCreationStore.getState();
    expect(state.venueInfo).toEqual(venueInfo);
  });

  it('should set venue forms', () => {
    const forms: VenueForm[] = [
      {
        id: 'form-1',
        name: 'Permission Slip',
        category: 'permission_slip',
        file_url: 'https://example.com/form1.pdf',
        required: true,
      },
      {
        id: 'form-2',
        name: 'Medical Waiver',
        category: 'waiver',
        file_url: 'https://example.com/form2.pdf',
        required: false,
      },
    ];

    useTripCreationStore.getState().setVenueForms(forms);
    
    const state = useTripCreationStore.getState();
    expect(state.venueForms).toEqual(forms);
  });

  it('should pre-populate trip details from venue and experience', () => {
    const venueInfo: VenueInfo = {
      id: 'venue-1',
      name: 'Science Museum',
      address: {
        street: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
      },
      contact_email: 'info@sciencemuseum.org',
      contact_phone: '555-0100',
      website: 'https://sciencemuseum.org',
    };

    const experience = {
      id: 'exp-1',
      title: 'Space Exploration Workshop',
      description: 'Learn about space and planets',
      event_date: '2024-03-15',
      event_time: '10:00',
      cost_cents: 1500,
      location: 'Main Hall',
      created_at: '2024-01-01',
      donation_message: null,
      indemnification: null,
      payment_description: null,
    };

    const forms: VenueForm[] = [
      {
        id: 'form-1',
        name: 'Permission Slip',
        category: 'permission_slip',
        file_url: 'https://example.com/form1.pdf',
        required: true,
      },
    ];

    useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);
    
    const state = useTripCreationStore.getState();
    
    // Check venue info is set
    expect(state.venueInfo).toEqual(venueInfo);
    
    // Check experience is set
    expect(state.selectedExperience).toEqual(experience);
    
    // Check forms are set
    expect(state.venueForms).toEqual(forms);
    
    // Check trip details are pre-populated
    expect(state.tripDetails).toEqual({
      name: 'Science Museum - Space Exploration Workshop',
      date: '',
      time: '10:00',
      description: 'Learn about space and planets',
      specialRequirements: '',
    });
  });

  it('should handle experience without time', () => {
    const venueInfo: VenueInfo = {
      id: 'venue-1',
      name: 'Art Gallery',
      address: {
        street: '456 Art St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      },
      contact_email: 'info@artgallery.org',
      contact_phone: null,
      website: null,
    };

    const experience = {
      id: 'exp-2',
      title: 'Modern Art Tour',
      description: null,
      event_date: '2024-04-20',
      event_time: null,
      cost_cents: 2000,
      location: 'Gallery Floor 2',
      created_at: '2024-01-01',
      donation_message: null,
      indemnification: null,
      payment_description: null,
    };

    useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, []);
    
    const state = useTripCreationStore.getState();
    
    expect(state.tripDetails).toEqual({
      name: 'Art Gallery - Modern Art Tour',
      date: '',
      time: '',
      description: '',
      specialRequirements: '',
    });
  });

  it('should reset venue info when resetting store', () => {
    const venueInfo: VenueInfo = {
      id: 'venue-1',
      name: 'Museum',
      address: {
        street: '123 St',
        city: 'City',
        state: 'ST',
        zipCode: '12345',
      },
      contact_email: 'info@museum.org',
      contact_phone: null,
      website: null,
    };

    useTripCreationStore.getState().setVenueInfo(venueInfo);
    useTripCreationStore.getState().setVenueForms([
      {
        id: 'form-1',
        name: 'Form',
        category: 'waiver',
        file_url: 'url',
        required: true,
      },
    ]);

    useTripCreationStore.getState().reset();
    
    const state = useTripCreationStore.getState();
    expect(state.venueInfo).toBeNull();
    expect(state.venueForms).toEqual([]);
  });

  it('should preserve special requirements when set', () => {
    const tripDetails = {
      name: 'Field Trip',
      date: '2024-05-01',
      time: '09:00',
      description: 'Educational trip',
      specialRequirements: 'Wheelchair accessible, nut-free lunch',
    };

    useTripCreationStore.getState().setTripDetails(tripDetails);
    
    const state = useTripCreationStore.getState();
    expect(state.tripDetails?.specialRequirements).toBe('Wheelchair accessible, nut-free lunch');
  });
});
