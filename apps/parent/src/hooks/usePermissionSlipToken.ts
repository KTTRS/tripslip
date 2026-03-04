import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Database } from '@tripslip/database';
import { supabase } from '../lib/supabase';

type PermissionSlip = Database['public']['Tables']['permission_slips']['Row'] & {
  students: {
    id: string;
    first_name: string;
    last_name: string;
    grade_level: string;
    medical_conditions?: string;
  };
  trips: {
    id: string;
    title: string;
    trip_date: string;
    departure_time: string;
    return_time: string;
    estimated_cost_cents: number;
    experiences: {
      title: string;
      description: string;
    };
    venues: {
      name: string;
      address: string;
      city: string;
      state: string;
    };
  };
};

export function usePermissionSlipToken() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [slip, setSlip] = useState<PermissionSlip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token');
      setLoading(false);
      return;
    }

    fetchPermissionSlip(token);
  }, [token]);

  const fetchPermissionSlip = async (magicToken: string) => {
    try {
      // Fetch permission slip by magic link token
      const { data, error: fetchError } = await supabase
        .from('permission_slips')
        .select(`
          *,
          students (
            id,
            first_name,
            last_name,
            grade_level,
            medical_conditions
          ),
          trips (
            id,
            title,
            trip_date,
            departure_time,
            return_time,
            estimated_cost_cents,
            experiences (
              title,
              description
            ),
            venues (
              name,
              address,
              city,
              state
            )
          )
        `)
        .eq('magic_link_token', magicToken)
        .single();

      if (fetchError) {
        throw new Error('Permission slip not found or link has expired');
      }

      if (!data) {
        throw new Error('Permission slip not found');
      }

      // Check if already signed
      if (data.status === 'signed' || data.status === 'paid') {
        setError('This permission slip has already been signed');
        setLoading(false);
        return;
      }

      setSlip(data as PermissionSlip);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permission slip');
      setLoading(false);
    }
  };

  return { slip, loading, error, token };
}
