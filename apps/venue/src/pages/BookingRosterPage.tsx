import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { VenueBookingService } from '@tripslip/database';

interface SharedStudent {
  firstName: string;
  lastName: string;
  age?: number;
  gradeLevel?: string;
  medicalInfo?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}

interface RosterData {
  bookingId: string;
  venueId: string;
  students: SharedStudent[];
  consentedStudentCount: number;
  totalStudentCount: number;
  sharedAt: string;
  lastUpdatedAt: string;
}

export function BookingRosterPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingService = new VenueBookingService(supabase);

  useEffect(() => {
    if (bookingId) {
      loadRosterData();
    }
  }, [bookingId]);

  async function loadRosterData() {
    if (!bookingId) return;

    try {
      setLoading(true);
      setError(null);

      // Load booking details
      const bookingData = await bookingService.getBookingById(bookingId);
      setBooking(bookingData);

      // Load shared roster data
      const rosterData = await bookingService.getSharedRosterData(bookingId);
      setRoster(rosterData as RosterData);
    } catch (err) {
      console.error('Error loading roster:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  }

  async function downloadRoster(format: 'csv' | 'pdf') {
    if (!roster) return;

    try {
      if (format === 'csv') {
        // Generate CSV
        const headers = ['First Name', 'Last Name', 'Grade', 'Allergies', 'Dietary Restrictions', 'Parent Name', 'Parent Phone', 'Emergency Contact'];
        const rows = roster.students.map(student => [
          student.firstName,
          student.lastName,
          student.gradeLevel || '',
          student.medicalInfo?.allergies.join('; ') || '',
          student.dietaryRestrictions?.join('; ') || '',
          student.parentName || '',
          student.parentPhone || '',
          student.emergencyContacts?.map(ec => `${ec.name} (${ec.phone})`).join('; ') || '',
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `roster-${bookingId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For PDF, we would need a PDF generation library
        alert('PDF download will be implemented with a PDF generation library');
      }
    } catch (err) {
      console.error('Error downloading roster:', err);
      alert('Failed to download roster');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roster...</p>
        </div>
      </div>
    );
  }

  if (error || !roster || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-red-600 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-gray-600">{error || 'Roster not found'}</p>
            <button
              onClick={() => navigate('/bookings')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Roster</h1>
              <p className="mt-1 text-gray-600">
                Booking #{booking.confirmation_number}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Last updated: {new Date(roster.lastUpdatedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to Bookings
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900">Total Students</div>
              <div className="text-2xl font-bold text-blue-600">{roster.totalStudentCount}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm font-medium text-green-900">Consented</div>
              <div className="text-2xl font-bold text-green-600">{roster.consentedStudentCount}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900">Pending</div>
              <div className="text-2xl font-bold text-gray-600">
                {roster.totalStudentCount - roster.consentedStudentCount}
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => downloadRoster('csv')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV
            </button>
            <button
              onClick={() => downloadRoster('pdf')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-medium text-yellow-900">Privacy Notice</h3>
              <p className="text-sm text-yellow-800 mt-1">
                This roster contains sensitive student information shared with parent consent. 
                Please handle this data responsibly and delete it after the trip is completed, 
                in compliance with FERPA, COPPA, and GDPR regulations.
              </p>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Student Information</h2>
          </div>

          {roster.students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No student information available yet.</p>
              <p className="text-sm mt-2">Information will appear as parents complete permission slips.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {roster.students.map((student, index) => (
                <div key={index} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      {student.gradeLevel && (
                        <p className="text-sm text-gray-600">Grade {student.gradeLevel}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Medical Information */}
                    {student.medicalInfo && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Medical Information</h4>
                        {student.medicalInfo.allergies.length > 0 && (
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Allergies:</span> {student.medicalInfo.allergies.join(', ')}
                          </div>
                        )}
                        {student.medicalInfo.medications.length > 0 && (
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Medications:</span> {student.medicalInfo.medications.join(', ')}
                          </div>
                        )}
                        {student.medicalInfo.conditions.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Conditions:</span> {student.medicalInfo.conditions.join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dietary & Accessibility */}
                    <div>
                      {student.dietaryRestrictions && student.dietaryRestrictions.length > 0 && (
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Dietary Restrictions</h4>
                          <p className="text-sm text-gray-600">{student.dietaryRestrictions.join(', ')}</p>
                        </div>
                      )}
                      {student.accessibilityNeeds && student.accessibilityNeeds.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Accessibility Needs</h4>
                          <p className="text-sm text-gray-600">{student.accessibilityNeeds.join(', ')}</p>
                        </div>
                      )}
                    </div>

                    {/* Parent Contact */}
                    {student.parentName && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Parent Contact</h4>
                        <div className="text-sm text-gray-600">
                          <div>{student.parentName}</div>
                          {student.parentEmail && <div>{student.parentEmail}</div>}
                          {student.parentPhone && <div>{student.parentPhone}</div>}
                        </div>
                      </div>
                    )}

                    {/* Emergency Contacts */}
                    {student.emergencyContacts && student.emergencyContacts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Emergency Contacts</h4>
                        {student.emergencyContacts.map((contact, idx) => (
                          <div key={idx} className="text-sm text-gray-600 mb-1">
                            {contact.name} ({contact.relationship}): {contact.phone}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
