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

  const inputClass = (hasError: boolean) => `
    mt-1 block w-full rounded-lg border-2 px-3 py-2 text-sm
    ${hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-[#F5C518] focus:ring-[#F5C518]'
    }
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `;

  return (
    <form onSubmit={onSubmit} className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-6">
      <h2 className="text-2xl font-bold text-[#0A0A0A]">
        {t('permissionSlip.parentInformation')}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            className={inputClass(!!formErrors.parentFirstName)}
            disabled={submitting}
            autoComplete="given-name"
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
            className={inputClass(!!formErrors.parentLastName)}
            disabled={submitting}
            autoComplete="family-name"
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
            className={inputClass(!!formErrors.parentEmail)}
            disabled={submitting}
            autoComplete="email"
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
            className={inputClass(!!formErrors.parentPhone)}
            disabled={submitting}
            autoComplete="tel"
          />
          {formErrors.parentPhone && (
            <p className="mt-1 text-sm text-red-600">{formErrors.parentPhone}</p>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-bold text-[#0A0A0A] mb-4">
          {t('permissionSlip.emergencyContact')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              className={inputClass(!!formErrors.emergencyContactName)}
              disabled={submitting}
              autoComplete="name"
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
              className={inputClass(!!formErrors.emergencyContactPhone)}
              disabled={submitting}
              autoComplete="tel"
            />
            {formErrors.emergencyContactPhone && (
              <p className="mt-1 text-sm text-red-600">{formErrors.emergencyContactPhone}</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <SignatureCapture
          onSignatureChange={onSignatureChange}
          value={formData.signature}
        />
        {formErrors.signature && (
          <p className="mt-1 text-sm text-red-600">{formErrors.signature}</p>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-8 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-lg border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 transition-all duration-150"
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
