import { useTranslation } from 'react-i18next';

interface StudentInfoProps {
  student: {
    first_name: string;
    last_name: string;
    grade_level: string;
    medical_conditions?: string;
  };
}

export function StudentInfo({ student }: StudentInfoProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-blue-50 rounded-lg p-6 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        {t('permissionSlip.studentInformation')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {t('permissionSlip.studentName')}
          </p>
          <p className="text-gray-900">
            {student.first_name} {student.last_name}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">
            {t('permissionSlip.gradeLevel')}
          </p>
          <p className="text-gray-900">{student.grade_level}</p>
        </div>

        {student.medical_conditions && (
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">
              {t('permissionSlip.medicalConditions')}
            </p>
            <p className="text-gray-900">{student.medical_conditions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
