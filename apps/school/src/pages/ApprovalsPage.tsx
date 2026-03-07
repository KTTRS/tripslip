import { useSchoolAuth } from '../contexts/SchoolAuthContext';
import { Layout } from '../components/Layout';
import { TripApprovalWorkflow } from '../components/TripApprovalWorkflow';

export default function ApprovalsPage() {
  const { schoolId, schoolLoading, schoolError } = useSchoolAuth();

  if (schoolLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approvals...</p>
        </div>
      </Layout>
    );
  }

  if (schoolError || !schoolId) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl p-8 max-w-md mx-auto bg-white">
            <img src="/images/icon-shield.png" alt="" className="mx-auto h-16 w-16 object-contain drop-shadow-md" />
            <h3 className="mt-4 text-lg font-bold text-[#0A0A0A]">
              No School Association
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {schoolError || 'Your account is not associated with a school. Please contact support.'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TripApprovalWorkflow schoolId={schoolId} />
    </Layout>
  );
}
