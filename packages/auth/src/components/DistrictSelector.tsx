import React from 'react';
import type { SupabaseClient } from '@tripslip/database';

export interface District {
  id: string;
  name: string;
  code: string | null;
}

export interface DistrictSelectorProps {
  supabase: SupabaseClient;
  value: string;
  onChange: (districtName: string) => void;
  error?: string;
}

export function DistrictSelector({
  supabase,
  value,
  onChange,
  error,
}: DistrictSelectorProps) {
  return (
    <div>
      <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
        District Name *
      </label>
      <input
        id="district"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : ''
        }`}
        placeholder="Enter your district name"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">
        Type your district's full name. We'll set everything up for you.
      </p>
    </div>
  );
}
