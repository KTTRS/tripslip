import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

export function PermissionSlipPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Permission Slip</h1>
        <button
          onClick={() => navigate('/success')}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
