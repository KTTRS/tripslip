import React, { useState } from 'react';
import type { SupabaseClient } from '@tripslip/database';

export interface School {
  id: string;
  name: string;
  district_id: string | null;
}

export interface SchoolSelectorProps {
  supabase: SupabaseClient;
  value: string;
  onChange: (schoolName: string) => void;
  error?: string;
  districtId?: string;
}

export function SchoolSelector({
  supabase,
  value,
  onChange,
  error,
  districtId,
}: SchoolSelectorProps) {
  return (
    <div>
      <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
        School Name *
      </label>
      <input
        id="school"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : ''
        }`}
        placeholder="Enter your school name"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">
        Type your school's full name. We'll set everything up for you.
      </p>
    </div>
  );
}
