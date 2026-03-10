import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Badge } from '@tripslip/ui';

interface ConsentTrackerProps {
  tripId: string;
  studentCount: number;
}

export function ConsentTracker({ tripId, studentCount }: ConsentTrackerProps) {
  const [signedCount, setSignedCount] = useState<number | null>(null);
  const [totalSlips, setTotalSlips] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsentStatus();
  }, [tripId]);

  const loadConsentStatus = async () => {
    try {
      const { data: slips } = await supabase
        .from('permission_slips')
        .select('id, status, signed_at')
        .eq('trip_id', tripId);

      if (slips) {
        setTotalSlips(slips.length);
        const signed = slips.filter(s =>
          s.status === 'signed' || s.status === 'paid' || s.status === 'signed_pending_payment'
        ).length;
        setSignedCount(signed);
      }
    } catch {
      setSignedCount(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className="text-xs text-gray-400">...</span>;
  }

  if (signedCount === null || totalSlips === 0) {
    return <span className="text-xs text-gray-400">No slips</span>;
  }

  const percent = Math.round((signedCount / totalSlips) * 100);
  const allSigned = signedCount === totalSlips;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Badge variant={allSigned ? 'success' : percent > 50 ? 'yellow' : 'outline'} className="text-[10px] px-1.5 py-0">
          {signedCount}/{totalSlips}
        </Badge>
      </div>
      <div className="w-16 bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${allSigned ? 'bg-green-500' : 'bg-[#F5C518]'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
