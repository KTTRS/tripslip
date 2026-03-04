/**
 * District Selector Component
 * Dropdown for selecting a district during signup
 */

import React, { useEffect, useState } from 'react';
import type { SupabaseClient } from '@tripslip/database';

export interface District {
  id: string;
  name: string;
  code: string | null;
}

export interface DistrictSelectorProps {
  supabase: SupabaseClient;
  value: string;
  onChange: (districtId: string) => void;
  error?: string;
}

export function DistrictSelector({
  supabase,
  value,
  onChange,
  error,
}: DistrictSelectorProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await (supabase as any)
        .from('districts')
        .select('id, name, code')
        .order('name');

      if (error) throw error;

      setDistricts(data || []);
    } catch (err) {
      console.error('Failed to load districts:', err);
      setLoadError('Failed to load districts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
        District *
      </label>
      <select
        id="district"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">
          {loading ? 'Loading districts...' : 'Select a district'}
        </option>
        {districts.map((district) => (
          <option key={district.id} value={district.id}>
            {district.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {loadError && <p className="mt-1 text-sm text-red-600">{loadError}</p>}
      <p className="mt-1 text-xs text-gray-500">
        Don't see your district?{' '}
        <a href="/request-organization" className="text-blue-600 hover:text-blue-700 underline">
          Request to add it
        </a>
      </p>
    </div>
  );
}
