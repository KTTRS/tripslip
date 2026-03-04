/**
 * School Selector Component
 * Dropdown for selecting a school during signup
 */

import React, { useEffect, useState } from 'react';
import type { SupabaseClient } from '@tripslip/database';

export interface School {
  id: string;
  name: string;
  district_id: string | null;
}

export interface SchoolSelectorProps {
  supabase: SupabaseClient;
  value: string;
  onChange: (schoolId: string) => void;
  error?: string;
  districtId?: string; // Optional filter by district
}

export function SchoolSelector({
  supabase,
  value,
  onChange,
  error,
  districtId,
}: SchoolSelectorProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadSchools();
  }, [districtId]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      let query = (supabase as any)
        .from('schools')
        .select('id, name, district_id')
        .order('name');

      if (districtId) {
        query = query.eq('district_id', districtId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSchools(data || []);
    } catch (err) {
      console.error('Failed to load schools:', err);
      setLoadError('Failed to load schools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
        School *
      </label>
      <select
        id="school"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">
          {loading ? 'Loading schools...' : 'Select a school'}
        </option>
        {schools.map((school) => (
          <option key={school.id} value={school.id}>
            {school.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {loadError && <p className="mt-1 text-sm text-red-600">{loadError}</p>}
      <p className="mt-1 text-xs text-gray-500">
        Don't see your school?{' '}
        <a href="/request-organization" className="text-blue-600 hover:text-blue-700 underline">
          Request to add it
        </a>
      </p>
    </div>
  );
}
