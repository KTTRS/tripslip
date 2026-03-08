import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';

interface ChildTrip {
  slipId: string;
  slipStatus: string;
  signedAt: string | null;
  studentName: string;
  tripDate: string;
  tripTime: string;
  tripStatus: string;
  experienceTitle: string;
  venueName: string;
  directLinkToken: string;
  isFree: boolean;
  amountPaid: number | null;
}

interface ChildProfile {
  studentId: string;
  firstName: string;
  lastName: string;
  grade: string;
  rosterName: string;
}

export function ParentDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [parentRecord, setParentRecord] = useState<any>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [trips, setTrips] = useState<ChildTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      navigate('/login');
      return;
    }
    setUser(authUser);
    await loadParentData(authUser.id);
  };

  const loadParentData = async (userId: string) => {
    try {
      const { data: parent } = await supabase
        .from('parents')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!parent) {
        setLoading(false);
        return;
      }
      setParentRecord(parent);

      const { data: studentLinks } = await supabase
        .from('student_parents')
        .select('student_id, relationship, students(id, first_name, last_name, grade, roster_id, rosters(name))')
        .eq('parent_id', parent.id);

      const childProfiles: ChildProfile[] = [];
      if (studentLinks) {
        for (const link of studentLinks) {
          const s = link.students as any;
          if (s) {
            childProfiles.push({
              studentId: s.id,
              firstName: s.first_name,
              lastName: s.last_name,
              grade: s.grade || '',
              rosterName: s.rosters?.name || '',
            });
          }
        }
      }
      setChildren(childProfiles);

      const studentIds = childProfiles.map(c => c.studentId);

      const { data: slips } = await supabase
        .from('permission_slips')
        .select(`
          id,
          status,
          signed_at,
          form_data,
          student_id,
          trips (
            trip_date,
            trip_time,
            status,
            direct_link_token,
            is_free,
            experiences (
              title,
              venues (
                name
              )
            )
          )
        `)
        .or(`signed_by_parent_id.eq.${parent.id},student_id.in.(${studentIds.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(50);

      const tripList: ChildTrip[] = [];
      if (slips) {
        for (const slip of slips) {
          const t = slip.trips as any;
          const fd = slip.form_data as any;

          let studentName = 'Unknown Student';
          if (fd?.childName) {
            studentName = fd.childName;
          } else if (fd?.studentFirstName && fd?.studentLastName) {
            studentName = `${fd.studentFirstName} ${fd.studentLastName}`;
          } else if (slip.student_id) {
            const child = childProfiles.find(c => c.studentId === slip.student_id);
            if (child) studentName = `${child.firstName} ${child.lastName}`;
          }

          let amountPaid: number | null = null;
          if (slip.status === 'paid') {
            const { data: payments } = await supabase
              .from('payments')
              .select('amount_cents')
              .eq('permission_slip_id', slip.id)
              .eq('status', 'succeeded');
            if (payments?.length) {
              amountPaid = payments.reduce((sum: number, p: any) => sum + p.amount_cents, 0);
            }
          }

          tripList.push({
            slipId: slip.id,
            slipStatus: slip.status,
            signedAt: slip.signed_at,
            studentName,
            tripDate: t?.trip_date || '',
            tripTime: t?.trip_time || '',
            tripStatus: t?.status || '',
            experienceTitle: t?.experiences?.title || 'Field Trip',
            venueName: t?.experiences?.venues?.name || '',
            directLinkToken: t?.direct_link_token || '',
            isFree: t?.is_free || false,
            amountPaid,
          });
        }
      }
      setTrips(tripList);
    } catch (err) {
      console.error('Failed to load parent data:', err);
      setDashboardError('We had trouble loading your dashboard. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSlipStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-800 border-green-300',
      signed: 'bg-blue-100 text-blue-800 border-blue-300',
      signed_pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      sent: 'bg-purple-100 text-purple-800 border-purple-300',
      pending: 'bg-gray-100 text-gray-700 border-gray-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    const labels: Record<string, string> = {
      paid: 'Paid',
      signed: 'Signed',
      signed_pending_payment: 'Payment Needed',
      sent: 'Awaiting Signature',
      pending: 'Pending',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const upcomingTrips = trips.filter(t => t.tripStatus !== 'completed' && t.tripStatus !== 'cancelled' && t.slipStatus !== 'cancelled');
  const pastTrips = trips.filter(t => t.tripStatus === 'completed' || t.tripStatus === 'cancelled' || t.slipStatus === 'cancelled');
  const needsAction = trips.filter(t => t.slipStatus === 'sent' || t.slipStatus === 'signed_pending_payment');

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b-2 border-[#0A0A0A] px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img src="/images/tripslip-logo.png" alt="TripSlip" className="h-10 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {parentRecord?.first_name} {parentRecord?.last_name}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-[#0A0A0A] font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#0A0A0A]">
            Welcome back{parentRecord?.first_name ? `, ${parentRecord.first_name}` : ''}
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your children's field trips</p>
        </div>

        {dashboardError && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">Something went wrong</p>
                <p className="text-sm text-red-700 mt-1">{dashboardError}</p>
              </div>
              <button
                onClick={() => {
                  setDashboardError(null);
                  setLoading(true);
                  if (user) loadParentData(user.id);
                }}
                className="px-3 py-1 text-xs font-bold bg-red-100 text-red-800 rounded border border-red-300 hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {needsAction.length > 0 && (
          <div className="bg-[#FFF8E1] border-2 border-[#F5C518] rounded-xl p-4">
            <h2 className="font-bold text-[#0A0A0A] mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#F5C518]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Action Needed
            </h2>
            <div className="space-y-2">
              {needsAction.map(trip => (
                <div key={trip.slipId} className="flex items-center justify-between bg-white rounded-lg border border-[#F5C518] px-4 py-3">
                  <div>
                    <p className="font-bold text-sm text-[#0A0A0A]">{trip.experienceTitle}</p>
                    <p className="text-xs text-gray-500">{trip.studentName} · {formatDate(trip.tripDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSlipStatusBadge(trip.slipStatus)}
                    {trip.directLinkToken && (
                      <a
                        href={`/trip/${trip.directLinkToken}`}
                        className="px-3 py-1 text-xs font-bold bg-[#F5C518] text-[#0A0A0A] rounded border-2 border-[#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] transition-all"
                      >
                        {trip.slipStatus === 'signed_pending_payment' ? 'Pay Now' : 'Sign Now'}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {children.length > 0 && (
          <section>
            <h2 className="text-xl font-display font-bold text-[#0A0A0A] mb-3">My Children</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map(child => (
                <div key={child.studentId} className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E8F5E9] rounded-full border-2 border-[#0A0A0A] flex items-center justify-center">
                      <span className="font-bold text-[#0A0A0A]">{child.firstName[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-[#0A0A0A]">{child.firstName} {child.lastName}</p>
                      <p className="text-xs text-gray-500">
                        {child.grade ? `Grade ${child.grade}` : ''}{child.rosterName ? ` · ${child.rosterName}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {upcomingTrips.length > 0 && (
          <section>
            <h2 className="text-xl font-display font-bold text-[#0A0A0A] mb-3">Upcoming Trips</h2>
            <div className="space-y-3">
              {upcomingTrips.map(trip => (
                <div key={trip.slipId} className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#0A0A0A]">{trip.experienceTitle}</h3>
                      {trip.venueName && <p className="text-sm text-gray-600">{trip.venueName}</p>}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-500">
                        <span>{formatDate(trip.tripDate)}</span>
                        <span>·</span>
                        <span>{trip.studentName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getSlipStatusBadge(trip.slipStatus)}
                      {trip.amountPaid !== null && (
                        <span className="text-xs font-mono text-gray-500">
                          ${(trip.amountPaid / 100).toFixed(2)} paid
                        </span>
                      )}
                      {trip.isFree && (
                        <span className="text-xs font-bold text-green-700">FREE</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pastTrips.length > 0 && (
          <section>
            <h2 className="text-xl font-display font-bold text-[#0A0A0A] mb-3">Past Trips</h2>
            <div className="space-y-3">
              {pastTrips.map(trip => (
                <div key={trip.slipId} className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[2px_2px_0px_#0A0A0A] p-4 opacity-80">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#0A0A0A]">{trip.experienceTitle}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                        <span>{formatDate(trip.tripDate)}</span>
                        <span>·</span>
                        <span>{trip.studentName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getSlipStatusBadge(trip.slipStatus)}
                      {trip.amountPaid !== null && (
                        <span className="text-xs font-mono text-gray-500">
                          ${(trip.amountPaid / 100).toFixed(2)} paid
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {trips.length === 0 && children.length === 0 && (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center">
            <img src="/images/icon-permission.png" alt="" className="w-20 h-20 mx-auto mb-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
            <h2 className="text-xl font-display font-bold text-[#0A0A0A] mb-2">No Trips Yet</h2>
            <p className="text-gray-600 mb-4">
              When your child's teacher sends a permission slip link, your trips will appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
