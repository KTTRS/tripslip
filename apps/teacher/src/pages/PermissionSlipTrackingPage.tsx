import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@tripslip/ui';
import { createSupabaseClient } from '@tripslip/database';
import type { Tables } from '@tripslip/database';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { 
  ArrowLeft, 
  Download, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
  Send
} from 'lucide-react';
import CommunicationModal from '../components/communication/CommunicationModal';

type Student = Tables<'students'>;
type PermissionSlip = Tables<'permission_slips'>;
type Payment = Tables<'payments'>;

interface StudentWithSlip extends Student {
  permission_slip?: PermissionSlip & {
    payments?: Payment[];
  };
}

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function PermissionSlipTrackingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState<any>(null);
  const [students, setStudents] = useState<StudentWithSlip[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [selectedSlip, setSelectedSlip] = useState<StudentWithSlip | null>(null);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  
  useEffect(() => {
    if (tripId) {
      fetchTripAndSlips();
    }
  }, [tripId]);
  
  useEffect(() => {
    filterAndSortStudents();
  }, [searchQuery, statusFilter, sortBy, students]);
  
  const fetchTripAndSlips = async () => {
    if (!tripId) return;
    
    try {
      setLoading(true);
      
      // Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('invitations')
        .select(`
          *,
          experience:experiences (
            title,
            cost_cents,
            event_date,
            event_time
          )
        `)
        .eq('id', tripId)
        .single();
      
      if (tripError) throw tripError;
      setTrip(tripData);
      
      // Fetch students with permission slips and payments
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          permission_slip:permission_slips (
            id,
            status,
            signed_at,
            created_at,
            payments (
              id,
              status,
              amount_cents,
              created_at,
              success
            )
          )
        `)
        .eq('invitation_id', tripId)
        .order('last_name', { ascending: true });
      
      if (studentsError) throw studentsError;
      
      // Transform data to handle single permission slip
      const transformedStudents = (studentsData || []).map((student: any) => ({
        ...student,
        permission_slip: Array.isArray(student.permission_slip) 
          ? student.permission_slip[0] 
          : student.permission_slip
      }));
      
      setStudents(transformedStudents);
      setFilteredStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching trip and slips:', error);
      toast.error('Failed to load permission slips');
    } finally {
      setLoading(false);
    }
  };
  
  const getSlipStatus = (student: StudentWithSlip): 'pending' | 'signed' | 'paid' | 'complete' => {
    if (!student.permission_slip) return 'pending';
    
    const slip = student.permission_slip;
    const hasPaidPayment = slip.payments?.some(p => p.success);
    
    if (hasPaidPayment) return 'complete';
    if (slip.status === 'signed') return 'signed';
    
    return 'pending';
  };
  
  const isOverdue = (student: StudentWithSlip): boolean => {
    if (!trip?.experience?.event_date) return false;
    if (getSlipStatus(student) === 'complete') return false;
    
    const eventDate = new Date(trip.experience.event_date);
    const today = new Date();
    const daysUntilEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Consider overdue if event is within 7 days and not complete
    return daysUntilEvent <= 7 && daysUntilEvent >= 0;
  };
  
  const filterAndSortStudents = () => {
    let filtered = [...students];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((student) =>
        student.first_name.toLowerCase().includes(query) ||
        student.last_name.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter(s => {
          const status = getSlipStatus(s);
          return status === 'pending' || status === 'signed';
        });
      } else if (statusFilter === 'complete') {
        filtered = filtered.filter(s => getSlipStatus(s) === 'complete');
      }
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
      } else if (sortBy === 'status') {
        const statusOrder = { pending: 0, signed: 1, paid: 2, complete: 3 };
        return statusOrder[getSlipStatus(a)] - statusOrder[getSlipStatus(b)];
      } else if (sortBy === 'submission') {
        const aDate = a.permission_slip?.signed_at || a.permission_slip?.created_at || '';
        const bDate = b.permission_slip?.signed_at || b.permission_slip?.created_at || '';
        return bDate.localeCompare(aDate); // Most recent first
      }
      return 0;
    });
    
    setFilteredStudents(filtered);
  };
  
  const calculateCompletionPercentage = (): number => {
    if (students.length === 0) return 0;
    const completeCount = students.filter(s => getSlipStatus(s) === 'complete').length;
    return Math.round((completeCount / students.length) * 100);
  };
  
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      signed: { label: 'Signed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-300', icon: DollarSign },
      complete: { label: 'Complete', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle }
    };
    
    return badges[status as keyof typeof badges] || badges.pending;
  };
  
  const downloadPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Permission Slip Summary', 20, 20);
      
      // Trip Info
      doc.setFontSize(12);
      doc.text(`Trip: ${trip.experience?.title}`, 20, 35);
      doc.text(`Date: ${new Date(trip.experience?.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, 20, 42);
      
      // Summary Stats
      doc.setFontSize(10);
      doc.text(`Total Students: ${students.length}`, 20, 55);
      doc.text(`Complete: ${statusCounts.complete}`, 20, 62);
      doc.text(`Signed: ${statusCounts.signed}`, 20, 69);
      doc.text(`Pending: ${statusCounts.pending}`, 20, 76);
      doc.text(`Completion: ${completionPercentage}%`, 20, 83);
      
      // Table Header
      let yPos = 100;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Student Name', 20, yPos);
      doc.text('Status', 100, yPos);
      doc.text('Signed At', 140, yPos);
      
      // Table Rows
      doc.setFont('helvetica', 'normal');
      yPos += 7;
      
      filteredStudents.forEach((student) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
          doc.setFont('helvetica', 'bold');
          doc.text('Student Name', 20, yPos);
          doc.text('Status', 100, yPos);
          doc.text('Signed At', 140, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 7;
        }
        
        const status = getSlipStatus(student);
        const badge = getStatusBadge(status);
        const signedAt = student.permission_slip?.signed_at 
          ? new Date(student.permission_slip.signed_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          : 'N/A';
        
        doc.text(`${student.first_name} ${student.last_name}`, 20, yPos);
        doc.text(badge.label, 100, yPos);
        doc.text(signedAt, 140, yPos);
        
        yPos += 7;
      });
      
      // Footer
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, 20, 285);
      
      // Save PDF
      doc.save(`permission-slips-${trip.experience?.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };
  
  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permission slips...</p>
        </div>
      </div>
    );
  }
  
  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Trip not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  const completionPercentage = calculateCompletionPercentage();
  const statusCounts = {
    pending: students.filter(s => getSlipStatus(s) === 'pending').length,
    signed: students.filter(s => getSlipStatus(s) === 'signed').length,
    complete: students.filter(s => getSlipStatus(s) === 'complete').length
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b-2 border-black p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-2 border-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold font-display">Permission Slip Tracking</h1>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto p-8">
        {/* Trip Info */}
        <Card className="border-2 border-black shadow-offset mb-6">
          <CardHeader>
            <CardTitle>{trip.experience?.title}</CardTitle>
            <p className="text-sm text-gray-600">
              {new Date(trip.experience?.event_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              {trip.experience?.event_time && ` at ${trip.experience.event_time}`}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-black">
                <div className="text-3xl font-bold">{students.length}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <div className="text-3xl font-bold text-green-700">{statusCounts.complete}</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <div className="text-3xl font-bold text-blue-700">{statusCounts.signed}</div>
                <div className="text-sm text-gray-600">Signed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                <div className="text-3xl font-bold text-yellow-700">{statusCounts.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
            
            {/* Completion Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Completion Progress</span>
                <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-black">
                <div
                  className="bg-green-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="pl-10 border-2 border-black"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-black rounded-md bg-white font-medium hover:bg-gray-50 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="complete">Complete</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border-2 border-black rounded-md bg-white font-medium hover:bg-gray-50 transition-colors"
          >
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
            <option value="submission">Sort by Submission Date</option>
          </select>
          
          <Button
            onClick={downloadPDF}
            className="shadow-offset"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          
          <Button
            onClick={() => setShowCommunicationModal(true)}
            className="shadow-offset bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Reminders
          </Button>
        </div>
        
        {/* Permission Slips Table */}
        <Card className="border-2 border-black shadow-offset">
          <CardContent className="p-0">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No students found matching your filters' 
                    : 'No permission slips yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-black">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Signed At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Payment At
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => {
                      const status = getSlipStatus(student);
                      const badge = getStatusBadge(status);
                      const BadgeIcon = badge.icon;
                      const overdue = isOverdue(student);
                      const paymentTimestamp = student.permission_slip?.payments?.find(p => p.success)?.created_at;
                      
                      return (
                        <tr key={student.id} className={`hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </div>
                              {overdue && (
                                <span title="Overdue - Event within 7 days">
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border-2 ${badge.color}`}>
                              <BadgeIcon className="h-3 w-3" />
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatTimestamp(student.permission_slip?.signed_at || null)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatTimestamp(paymentTimestamp || null)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSlip(student)}
                              className="border-2 border-black"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Details Modal */}
      {selectedSlip && (
        <SlipDetailsModal
          student={selectedSlip}
          trip={trip}
          onClose={() => setSelectedSlip(null)}
        />
      )}
      
      {/* Communication Modal */}
      {showCommunicationModal && (
        <CommunicationModal
          tripId={tripId!}
          tripTitle={trip.experience?.title || 'Field Trip'}
          students={students}
          onClose={() => setShowCommunicationModal(false)}
          onSuccess={() => {
            toast.success('Messages sent successfully');
            fetchTripAndSlips();
          }}
        />
      )}
    </div>
  );
}

// Slip Details Modal Component
interface SlipDetailsModalProps {
  student: StudentWithSlip;
  trip: any;
  onClose: () => void;
}

function SlipDetailsModal({ student, trip, onClose }: SlipDetailsModalProps) {
  const slip = student.permission_slip;
  const payment = slip?.payments?.find(p => p.success);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="border-2 border-black shadow-offset max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b-2 border-black">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Permission Slip Details</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {student.first_name} {student.last_name}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-2 border-black"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Student Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Student Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{student.first_name} {student.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Grade</p>
                <p className="font-medium">{student.grade}</p>
              </div>
            </div>
          </div>
          
          {/* Trip Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Trip Information</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Event</p>
                <p className="font-medium">{trip.experience?.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">
                  {new Date(trip.experience?.event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cost</p>
                <p className="font-medium">${((trip.experience?.cost_cents || 0) / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {/* Permission Slip Status */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Permission Slip Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-black">
                <div className="flex items-center gap-2">
                  {slip?.signed_at ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="font-medium">Signature</span>
                </div>
                <span className="text-sm text-gray-600">
                  {slip?.signed_at 
                    ? new Date(slip.signed_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })
                    : 'Not signed'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-black">
                <div className="flex items-center gap-2">
                  {payment ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="font-medium">Payment</span>
                </div>
                <span className="text-sm text-gray-600">
                  {payment 
                    ? `$${(payment.amount_cents / 100).toFixed(2)} - ${new Date(payment.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}`
                    : 'Not paid'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t-2 border-black">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-2 border-black"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
