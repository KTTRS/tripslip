import { useTranslation } from 'react-i18next';
import { SignatureCapture } from './SignatureCapture';

interface FormData {
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  signature: string | null;
}

interface FormErrors {
  parentFirstName?: string;
  parentLastName?: string;
  parentEmail?: string;
  parentPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  signature?: string;
}

interface PermissionSlipFormProps {
  formData: FormData;
  formErrors: FormErrors;
  onInputChange: (field: keyof FormData, value: string) => void;
  onSignatureChange: (signature: string | null) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  requiresPayment: boolean;
}

export function PermissionSlipForm({ 
  formData, 
  formErrors, 
  onInputChange, 
  onSignatureChange, 
  onSubmit, 
  submitting, 
  requiresPayment 
}: PermissionSlipFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        {t('permissionSlip.parentInformation')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="parentFirstName" className="block text-sm font-medium text-gray-700">
            {t('permissionSlip.parentFirstName')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="parentFirstName"
            value={formData.parentFirstName}
            onChange={(e) => onInputChange('parentFirstName', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              formErrors.parentFirstName
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={submitting}
          />
          {formErrors.parentFirstName && (
            <p className="mt-1 text-sm text-red-600">{formErrors.parentFirstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="parentLastName" className="block text-sm font-medium text-gray-700">
            {t('permissionSlip.parentLastName')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="parentLastName"
            value={formData.parentLastName}
            onChange={(e) => onInputChange('parentLastName', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              formErrors.parentLastName
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={submitting}
          />
          {formErrors.parentLastName && (
            <p className="mt-1 text-sm text-red-600">{formErrors.parentLastName}</p>
          )}
        </div>

        <div>
          <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700">
            {t('permissionSlip.parentEmail')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="email"
            id="parentEmail"
            value={formData.parentEmail}
            onChange={(e) => onInputChange('parentEmail', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              formErrors.parentEmail
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={submitting}
          />
          {formErrors.parentEmail && (
            <p className="mt-1 text-sm text-red-600">{formErrors.parentEmail}</p>
          )}
        </div>

        <div>
          <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700">
            {t('permissionSlip.parentPhone')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="tel"
            id="parentPhone"
            value={formData.parentPhone}
            onChange={(e) => onInputChange('parentPhone', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              formErrors.parentPhone
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={submitting}
          />
          {formErrors.parentPhone && (
            <p className="mt-1 text-sm text-red-600">{formErrors.parentPhone}</p>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('permissionSlip.emergencyContact')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
              {t('permissionSlip.emergencyContactName')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={(e) => onInputChange('emergencyContactName', e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                formErrors.emergencyContactName
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              disabled={submitting}
            />
            {formErrors.emergencyContactName && (
              <p className="mt-1 text-sm text-red-600">{formErrors.emergencyContactName}</p>
            )}
          </div>

          <div>
            <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
              {t('permissionSlip.emergencyContactPhone')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="tel"
              id="emergencyContactPhone"
              value={formData.emergencyContactPhone}
              onChange={(e) => onInputChange('emergencyContactPhone', e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                formErrors.emergencyContactPhone
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              disabled={submitting}
            />
            {formErrors.emergencyContactPhone && (
              <p className="mt-1 text-sm text-red-600">{formErrors.emergencyContactPhone}</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <SignatureCapture
          onSignatureChange={onSignatureChange}
          value={formData.signature}
        />
        {formErrors.signature && (
          <p className="mt-1 text-sm text-red-600">{formErrors.signature}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {submitting
            ? t('permissionSlip.submitting')
            : requiresPayment
            ? t('permissionSlip.signAndProceedToPayment')
            : t('permissionSlip.submitPermissionSlip')}
        </button>
      </div>
    </form>
  );
}
