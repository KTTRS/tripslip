import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Logger } from '@tripslip/utils';

const logger = new Logger();

interface PermissionSlipData {
  id: string;
  signed_at: string;
  students: {
    first_name: string;
    last_name: string;
  };
  trips: {
    trip_date: string;
    experiences: {
      title: string;
    };
  };
}

export function PermissionSlipSuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slipId = searchParams.get('slip');
  const token = searchParams.get('token');

  const [slip, setSlip] = useState<PermissionSlipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slipId || !token) {
      setError(t('permissionSlip.invalidLink'));
      setLoading(false);
      return;
    }

    fetchPermissionSlip();
  }, [slipId, token, t]);

  const fetchPermissionSlip = async () => {
    if (!slipId || !token) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('permission_slips')
        .select(`
          id,
          signed_at,
          students (
            first_name,
            last_name
          ),
          trips (
            experiences (
              title
            ),
            trip_date
          )
        `)
        .eq('id', slipId)
        .eq('magic_link_token', token)
        .single();

      if (fetchError || !data) {
        throw new Error('Permission slip not found');
      }

      if (!data.signed_at) {
        throw new Error('Permission slip has not been signed yet');
      }

      setSlip(data as PermissionSlipData);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load permission slip';
      logger.error('Failed to fetch permission slip for success page', err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !slip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('permissionSlip.errorTitle')}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || t('permissionSlip.notFound')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.goHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {/* Success Icon */}
        <div className="text-green-500 text-6xl mb-6">✅</div>
        
        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('permissionSlip.successTitle')}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {t('permissionSlip.successMessage', {
            studentName: `${slip.students.first_name} ${slip.students.last_name}`,
            tripTitle: slip.trips.experiences.title,
          })}
        </p>

        {/* Trip Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">
            {t('permissionSlip.tripSummary')}
          </h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <span className="font-medium">{t('permissionSlip.trip')}:</span> {slip.trips.experiences.title}
            </div>
            <div>
              <span className="font-medium">{t('permissionSlip.student')}:</span> {slip.students.first_name} {slip.students.last_name}
            </div>
            <div>
              <span className="font-medium">{t('permissionSlip.date')}:</span> {new Date(slip.trips.trip_date).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">{t('permissionSlip.signedAt')}:</span> {new Date(slip.signed_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            {t('permissionSlip.nextSteps')}
          </h3>
          <ul className="text-sm text-blue-700 space-y-1 text-left">
            <li>• {t('permissionSlip.confirmationEmail')}</li>
            <li>• {t('permissionSlip.tripReminders')}</li>
            <li>• {t('permissionSlip.contactTeacher')}</li>
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate('/')}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('common.done')}
        </button>
      </div>
    </div>
  );
}