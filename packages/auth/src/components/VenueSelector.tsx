import React from 'react';
import type { SupabaseClient } from '@tripslip/database';

export interface Venue {
  id: string;
  name: string;
  contact_email: string;
}

export interface VenueSelectorProps {
  supabase: SupabaseClient;
  value: string;
  onChange: (venueName: string) => void;
  error?: string;
}

export function VenueSelector({
  supabase,
  value,
  onChange,
  error,
}: VenueSelectorProps) {
  return (
    <div>
      <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
        Venue Name *
      </label>
      <input
        id="venue"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : ''
        }`}
        placeholder="Enter your venue name"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">
        Type your venue's full name. We'll set everything up for you.
      </p>
    </div>
  );
}
