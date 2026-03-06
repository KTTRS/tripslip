import { useTranslation } from 'react-i18next';

interface StudentInfoProps {
  student: {
    first_name: string;
    last_name: string;
    grade?: string;
    grade_level?: string;
    medical_info?: string;
    medical_conditions?: string;
  };
}

export function StudentInfo({ student }: StudentInfoProps) {
  const { t } = useTranslation();
  const grade = student.grade || student.grade_level || '';
  const medicalInfo = student.medical_info || student.medical_conditions;

  return (
    <div className="bg-[#F5C518]/10 border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-3">
      <h3 className="text-lg font-bold text-[#0A0A0A]">
        {t('permissionSlip.studentInformation')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {t('permissionSlip.studentName')}
          </p>
          <p className="text-[#0A0A0A] font-medium">
            {student.first_name} {student.last_name}
          </p>
        </div>

        {grade && (
          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('permissionSlip.gradeLevel')}
            </p>
            <p className="text-[#0A0A0A]">Grade {grade}</p>
          </div>
        )}

        {medicalInfo && (
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-gray-500">
              {t('permissionSlip.medicalConditions')}
            </p>
            <p className="text-[#0A0A0A] bg-red-50 border border-red-200 rounded-lg p-2 text-sm mt-1">
              {medicalInfo}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
