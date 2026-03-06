import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';
import { supabase } from '../lib/supabase';
import type { Tables, Json } from '@tripslip/database';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  AlertTriangle,
  Calendar,
  MapPin,
  DollarSign,
  Send,
  MessageSquare,
  Heart
} from 'lucide-react';
import { PermissionSlipStatusList } from '../components/PermissionSlipStatusList';
import { TripStatistics } from '../components/TripStatistics';
import { TripCancellationDialog } from '../components/TripCancellationDialog';
import CommunicationModal from '../components/communication/CommunicationModal';

type Trip = Tables<'trips'>;

interface TripWithDetails extends Trip {
  experience?: {
    id: string;
    title: string;
    description: string | null;
    venue?: {
      id: string;
      name: string;
      address: Json;
    };
    pricing_tiers?: Array<{
      id: string;
      price_cents: number;
      min_students: number;
      max_students: number;
    }>;
  };
}

export default function PermissionSlipTrackingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [studentsWithSlips, setStudentsWithSlips] = useState<any[]>([]);
  const [sendingAllSlips, setSendingAllSlips] = useState(false);
  
  useEffect(() => {
    if (tripId) {
      fetchTripDetails();
      fetchStudentsWithSlips();
    }
  }, [tripId]);
  
  const fetchTripDetails = async () => {
    if (!tripId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          *,
          experience:experiences (
            id,
            title,
            description,
            venue:venues (
              id,
              name,
              address
            ),
            pricing_tiers (
              id,
              price_cents,
              min_students,
              max_students
            )
          )
        `)
        .eq('id', tripId)
        .single();
      
      if (tripError) throw tripError;
      
      if (!tripData) {
        throw new Error('Trip not found');
      }
      
      setTrip(tripData);
    } catch (err: any) {
      console.error('Error fetching trip details:', err);
      setError(err.message || 'Failed to load trip details');
      toast.error('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStudentsWithSlips = async () => {
    if (!tripId) return;
    try {
      const { data: slips } = await supabase
        .from('permission_slips')
        .select(`
          id, status,
          student:students (
            id, first_name, last_name, grade, roster_id
          )
        `)
        .eq('trip_id', tripId);

      const mapped = (slips || []).map((slip: any) => {
        const student = Array.isArray(slip.student) ? slip.student[0] : slip.student;
        return {
          ...student,
          permission_slip: { id: slip.id, status: slip.status },
        };
      });
      setStudentsWithSlips(mapped);
    } catch (err) {
      console.error('Error fetching students with slips:', err);
    }
  };

  const handleSendAllSlips = async () => {
    if (!tripId) return;
    setSendingAllSlips(true);
    try {
      const response = await fetch('/api/send-bulk-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send permission slips');
      }
      toast.success(`Sent ${data.sent || 0} permission slip${data.sent !== 1 ? 's' : ''}`);
      fetchStudentsWithSlips();
    } catch (err: any) {
      console.error('Error sending all slips:', err);
      toast.error(err.message || 'Failed to send permission slips');
    } finally {
      setSendingAllSlips(false);
    }
  };

  const handleCancellationComplete = () => {
    toast.success('Trip has been cancelled successfully');
    navigate('/');
  };
  
  const formatCurrency = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatTime = (timeString: string): string => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const getBaseCost = (): number => {
    const pricingTiers = trip?.experience?.pricing_tiers;
    if (!pricingTiers || pricingTiers.length === 0) return 0;
    // Return the first pricing tier's cost, or find the lowest cost tier
    const lowestCostTier = pricingTiers.reduce((min, tier) => 
      tier.price_cents < min.price_cents ? tier : min
    );
    return lowestCostTier.price_cents;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'Trip not found'}</p>
          <Button onClick={() => navigate('/')} className="shadow-[4px_4px_0px_#0A0A0A]">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b-2 border-black p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-2 border-black shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
              style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-serif">Permission Slip Tracking</h1>
              <p className="text-sm text-gray-600 font-mono">
                Monitor real-time status and manage trip details
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {trip.status !== 'cancelled' && (
              <>
                <Button
                  onClick={handleSendAllSlips}
                  disabled={sendingAllSlips}
                  className="bg-[#F5C518] text-black border-2 border-black shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  {sendingAllSlips ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send All Permission Slips
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCommunicationModal(true)}
                  className="border-2 border-black shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Reminders
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCancellationDialog(true)}
                  className="border-2 border-red-500 text-red-700 hover:bg-red-50 shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Cancel Trip
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Trip Information Card */}
        <Card className="border-2 border-black shadow-[8px_8px_0px_#0A0A0A] bg-[#F5C518]">
          <CardHeader className="border-b-2 border-black">
            <CardTitle className="font-serif text-3xl">{trip.experience?.title}</CardTitle>
            {trip.status === 'cancelled' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 border-2 border-red-500 rounded-md">
                <AlertTriangle className="h-4 w-4 text-red-700" />
                <span className="text-sm font-semibold text-red-700 uppercase tracking-wide font-mono">
                  CANCELLED
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className="bg-white p-3 rounded-lg border-2 border-black">
                  <Calendar className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide font-mono">
                    Date & Time
                  </p>
                  <p className="font-semibold text-lg">
                    {trip.trip_date && formatDate(trip.trip_date)}
                  </p>
                  <p className="text-gray-700 font-mono">
                    {trip.trip_time && formatTime(trip.trip_time)}
                  </p>
                </div>
              </div>
              
              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="bg-white p-3 rounded-lg border-2 border-black">
                  <MapPin className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide font-mono">
                    Location
                  </p>
                  <p className="font-semibold text-lg">
                    {trip.experience?.venue?.name}
                  </p>
                  <p className="text-gray-700 text-sm">
                    {typeof trip.experience?.venue?.address === 'string' 
                      ? trip.experience.venue.address 
                      : 'Address not available'}
                  </p>
                </div>
              </div>
              
              {/* Cost */}
              <div className="flex items-start gap-3">
                <div className="bg-white p-3 rounded-lg border-2 border-black">
                  <DollarSign className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide font-mono">
                    Cost per Student
                  </p>
                  <p className="font-semibold text-lg font-mono">
                    {getBaseCost() > 0 ? formatCurrency(getBaseCost()) : 'Free'}
                  </p>
                  <p className="text-gray-700 text-sm">
                    Per student
                  </p>
                </div>
              </div>
            </div>
            
            {/* Description */}
            {trip.experience?.description && (
              <div className="mt-6 pt-6 border-t-2 border-black">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide font-mono mb-2">
                  Description
                </p>
                <p className="text-gray-800 leading-relaxed">
                  {trip.experience.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Assistance Fund Balance */}
        {((trip as any).assistance_fund_cents ?? 0) > 0 && (
          <Card className="border-2 border-black shadow-[8px_8px_0px_#0A0A0A] bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-[#F5C518] p-3 rounded-lg border-2 border-black">
                  <Heart className="h-6 w-6 text-black" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide font-mono">
                    Pay-It-Forward Fund
                  </p>
                  <p className="font-bold text-2xl font-mono text-[#0A0A0A]">
                    {formatCurrency((trip as any).assistance_fund_cents)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Contributed by families to help cover costs for students who need financial assistance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trip Statistics */}
        <TripStatistics tripId={tripId!} />
        
        {/* Permission Slip Status List */}
        <PermissionSlipStatusList tripId={tripId!} />
      </main>
      
      {/* Trip Cancellation Dialog */}
      <TripCancellationDialog
        tripId={tripId!}
        tripName={trip.experience?.title || 'Field Trip'}
        open={showCancellationDialog}
        onOpenChange={setShowCancellationDialog}
        onCancellationComplete={handleCancellationComplete}
      />

      {showCommunicationModal && (
        <CommunicationModal
          tripId={tripId!}
          tripTitle={trip.experience?.title || 'Field Trip'}
          students={studentsWithSlips}
          onClose={() => setShowCommunicationModal(false)}
          onSuccess={() => {
            fetchStudentsWithSlips();
          }}
        />
      )}
    </div>
  );
}