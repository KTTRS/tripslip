import { useSchoolAuth } from '../contexts/SchoolAuthContext';
import { Layout } from '../components/Layout';
import { TripApprovalWorkflow } from '../components/TripApprovalWorkflow';

export default function ApprovalsPage() {
  const { schoolId, schoolLoading, schoolError } = useSchoolAuth();

  if (schoolLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approvals...</p>
        </div>
      </Layout>
    );
  }

  if (schoolError || !schoolId) {
    return (
      <Layout>
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No School Association
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {schoolError || 'Your account is not associated with a school. Please contact support.'}
          </p>
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
