/**
 * Venue Selector Component
 * Dropdown for selecting a venue during signup
 */

import React, { useEffect, useState } from 'react';
import type { SupabaseClient } from '@tripslip/database';

export interface Venue {
  id: string;
  name: string;
  contact_email: string;
}

export interface VenueSelectorProps {
  supabase: SupabaseClient;
  value: string;
  onChange: (venueId: string) => void;
  error?: string;
}

export function VenueSelector({
  supabase,
  value,
  onChange,
  error,
}: VenueSelectorProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await (supabase as any)
        .from('venues')
        .select('id, name, contact_email')
        .order('name');

      if (error) throw error;

      setVenues(data || []);
    } catch (err) {
      console.error('Failed to load venues:', err);
      setLoadError('Failed to load venues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
        Venue *
      </label>
      <select
        id="venue"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">
          {loading ? 'Loading venues...' : 'Select a venue'}
        </option>
        {venues.map((venue) => (
          <option key={venue.id} value={venue.id}>
            {venue.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {loadError && <p className="mt-1 text-sm text-red-600">{loadError}</p>}
      <p className="mt-1 text-xs text-gray-500">
        Don't see your venue?{' '}
        <a href="/request-organization" className="text-blue-600 hover:text-blue-700 underline">
          Request to add it
        </a>
      </p>
    </div>
  );
}
