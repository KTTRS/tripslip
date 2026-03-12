import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, Button, Input } from '@tripslip/ui';
import { supabase } from '../lib/supabase';
import type { Tables } from '@tripslip/database';
import { toast } from 'sonner';
import { buildParentTripUrl } from '@tripslip/utils';
import { 
  ArrowLeft, 
  Plus, 
  Upload, 
  Download, 
  Edit2, 
  Trash2, 
  Search,
  Copy,
  Check,
  ClipboardCheck,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { AddStudentModal } from '../components/roster/AddStudentModal';
import { EditStudentModal } from '../components/roster/EditStudentModal';
import { CSVImportModal } from '../components/roster/CSVImportModal';

type Student = Tables<'students'>;
type PermissionSlip = Tables<'permission_slips'>;

interface StudentWithSlip extends Student {
  permission_slip?: PermissionSlip & {
    payments?: Array<{ status: string; amount_cents: number }>;
  };
}

export default function TripRosterPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState<any>(null);
  const [students, setStudents] = useState<StudentWithSlip[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  
  useEffect(() => {
    if (tripId) {
      fetchTripAndStudents();
    }
  }, [tripId]);
  
  useEffect(() => {
    filterStudents();
  }, [searchQuery, students]);
  
  const fetchTripAndStudents = async () => {
    if (!tripId) return;
    
    try {
      setLoading(true);
      
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          *,
          experience:experiences (
            title,
            venue:venues (name),
            pricing_tiers (price_cents)
          )
        `)
        .eq('id', tripId)
        .single();
      
      if (tripError) throw tripError;
      setTrip(tripData);
      
      const { data: slipsData, error: slipsError } = await supabase
        .from('permission_slips')
        .select(`
          id,
          status,
          signed_at,
          student_id,
          payments (
            status,
            amount_cents
          ),
          students (
            id,
            first_name,
            last_name,
            grade,
            medical_info,
            roster_id,
            created_at,
            updated_at
          )
        `)
        .eq('trip_id', tripId);
      
      if (slipsError) throw slipsError;
      
      const transformedStudents: StudentWithSlip[] = (slipsData || [])
        .filter((slip: any) => slip.students)
        .map((slip: any) => ({
          ...slip.students,
          permission_slip: {
            id: slip.id,
            status: slip.status,
            signed_at: slip.signed_at,
            payments: slip.payments,
          }
        }));
      
      transformedStudents.sort((a, b) => a.last_name.localeCompare(b.last_name));
      
      setStudents(transformedStudents);
      setFilteredStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching trip and students:', error);
      toast.error('Failed to load trip roster');
    } finally {
      setLoading(false);
    }
  };
  
  const filterStudents = () => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = students.filter((student) =>
      student.first_name.toLowerCase().includes(query) ||
      student.last_name.toLowerCase().includes(query) ||
      (student.grade ?? '').toLowerCase().includes(query)
    );
    
    setFilteredStudents(filtered);
  };
  
  const getPermissionSlipStatus = (student: StudentWithSlip) => {
    if (!student.permission_slip) {
      return { label: 'Pending', color: 'gray' };
    }
    
    const slip = student.permission_slip;
    const hasPaidPayment = slip.payments?.some(p => p.status === 'succeeded');
    
    if (hasPaidPayment) {
      return { label: 'Paid', color: 'green' };
    }
    
    if (slip.status === 'signed') {
      return { label: 'Signed', color: 'blue' };
    }
    
    if (slip.status === 'cancelled') {
      return { label: 'Cancelled', color: 'red' };
    }
    
    return { label: 'Pending', color: 'gray' };
  };

  const getPermissionSlipLink = () => {
    if (!trip?.direct_link_token) return null;
    return buildParentTripUrl(trip.direct_link_token);
  };

  const ensureLinkToken = async () => {
    if (trip?.direct_link_token) return trip.direct_link_token;
    
    setGeneratingLink(true);
    try {
      const token = crypto.randomUUID();
      const { error } = await supabase
        .from('trips')
        .update({ direct_link_token: token })
        .eq('id', tripId!);
      
      if (error) throw error;
      
      setTrip((prev: any) => ({ ...prev, direct_link_token: token }));
      return token;
    } catch (err) {
      console.error('Error generating link:', err);
      toast.error('Failed to generate link');
      return null;
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLink = async () => {
    const token = await ensureLinkToken();
    if (!token) return;
    
    const link = buildParentTripUrl(token);
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast.success('Link copied! Share it with parents.');
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      toast.info(`Copy this link: ${link}`);
    }
  };

  const copyMessage = async () => {
    const token = await ensureLinkToken();
    if (!token) return;
    
    const link = buildParentTripUrl(token);
    const tripName = trip?.experience?.title || 'the field trip';
    const venueName = trip?.experience?.venue?.name || '';
    const tripDate = trip?.trip_date 
      ? new Date(trip.trip_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : '';
    
    const message = `Hi! Please sign the permission slip for ${tripName}${venueName ? ` at ${venueName}` : ''}${tripDate ? ` on ${tripDate}` : ''}.\n\nSign here: ${link}\n\nThank you!`;
    
    try {
      await navigator.clipboard.writeText(message);
      setMessageCopied(true);
      toast.success('Message copied! Paste it into your messaging app.');
      setTimeout(() => setMessageCopied(false), 3000);
    } catch {
      toast.info(`Copy this message: ${message}`);
    }
  };
  
  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student? Their permission slip will be cancelled.')) {
      return;
    }
    
    try {
      const { error: slipError } = await supabase
        .from('permission_slips')
        .update({ status: 'cancelled' })
        .eq('student_id', studentId)
        .eq('trip_id', tripId!);
      
      if (slipError) throw slipError;
      
      toast.success('Student removed from trip');
      fetchTripAndStudents();
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Failed to remove student');
    }
  };
  
  const downloadCSVTemplate = () => {
    const csvContent = 'first_name,last_name,grade\nJohn,Doe,5th\nJane,Smith,6th';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_roster_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const costCents = trip?.experience?.pricing_tiers?.[0]?.price_cents || 0;

  const signedCount = students.filter(s => {
    const status = getPermissionSlipStatus(s);
    return status.label === 'Signed' || status.label === 'Paid';
  }).length;

  const pendingCount = students.filter(s => {
    const status = getPermissionSlipStatus(s);
    return status.label === 'Pending';
  }).length;
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto mb-4" />
            <p className="text-gray-600">Loading roster...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!trip) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <img src="/images/icon-compass.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-gray-600 mb-4">Trip not found</p>
            <Button 
              onClick={() => navigate('/')} 
              className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-semibold"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  const permissionLink = getPermissionSlipLink();
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/trips')}
            className="border-2 border-[#0A0A0A] rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Trips
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#0A0A0A]">{trip.experience?.title || 'Field Trip'}</h1>
            <p className="text-sm text-gray-500">{trip.experience?.venue?.name}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#F5C518]/15 via-[#F5C518]/5 to-transparent border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-5 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5C518]/20 border-2 border-[#0A0A0A] flex items-center justify-center p-1">
                  <img src="/images/icon-permission.png" alt="" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0A0A0A]">Share Permission Slip</h2>
                  <p className="text-xs text-gray-500">Copy the link below and share it with parents via email, text, ClassDojo, Remind, or any platform</p>
                </div>
              </div>

              {permissionLink ? (
                <div className="flex items-center gap-2 bg-white border-2 border-[#0A0A0A] rounded-xl px-4 py-2.5">
                  <span className="flex-1 text-sm text-gray-700 truncate font-mono">{permissionLink}</span>
                  <button
                    onClick={copyLink}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 font-semibold text-sm transition-all ${
                      linkCopied
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-[#F5C518] border-[#0A0A0A] text-[#0A0A0A] hover:translate-y-[1px] shadow-[2px_2px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A]'
                    }`}
                  >
                    {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {linkCopied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={copyLink}
                  disabled={generatingLink}
                  className="w-full flex items-center justify-center gap-2 bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-xl px-4 py-3 font-bold shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-50"
                >
                  <img src="/images/icon-magic.png" alt="" className="w-5 h-5" />
                  {generatingLink ? 'Generating...' : 'Generate Permission Slip Link'}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 lg:w-56">
              <button
                onClick={copyMessage}
                disabled={generatingLink}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                  messageCopied
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-white border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#F5C518]/10 shadow-[2px_2px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-y-[1px]'
                }`}
              >
                {messageCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {messageCopied ? 'Message Copied!' : 'Copy with Message'}
              </button>
              <p className="text-xs text-gray-400 leading-tight">Copies a pre-written message with the link — paste into any app you use to talk to parents</p>
            </div>
          </div>

          <img
            src="/images/char-pink-heart.png"
            alt=""
            className="absolute -right-2 -bottom-2 w-16 h-16 opacity-20 animate-float hidden lg:block"
          />
        </div>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card className="border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-blue-100 border-2 border-[#0A0A0A] flex items-center justify-center p-1">
                  <img src="/images/icon-team.png" alt="" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Students</p>
                  <p className="text-xl font-bold text-[#0A0A0A]">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-green-100 border-2 border-[#0A0A0A] flex items-center justify-center p-1">
                  <img src="/images/icon-shield.png" alt="" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Signed</p>
                  <p className="text-xl font-bold text-[#0A0A0A]">{signedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-orange-100 border-2 border-[#0A0A0A] flex items-center justify-center p-1">
                  <img src="/images/icon-megaphone.png" alt="" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Pending</p>
                  <p className="text-xl font-bold text-[#0A0A0A]">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-[#F5C518]/20 border-2 border-[#0A0A0A] flex items-center justify-center p-1">
                  <img src="/images/icon-payment.png" alt="" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Cost</p>
                  <p className="text-xl font-bold text-[#0A0A0A]">${(costCents / 100).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="pl-10 border-2 border-[#0A0A0A] rounded-xl"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => navigate(`/trips/${tripId}/manifest`)}
              className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all font-semibold rounded-xl"
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Take Attendance
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/trips/${tripId}/slips`)}
              className="border-2 border-[#0A0A0A] rounded-xl font-semibold"
            >
              <img src="/images/icon-tracking.png" alt="" className="w-4 h-4 mr-2" />
              Track Slips
            </Button>
            <Button
              variant="outline"
              onClick={downloadCSVTemplate}
              className="border-2 border-[#0A0A0A] rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCSVModal(true)}
              className="border-2 border-[#0A0A0A] rounded-xl"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all font-semibold rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>
        
        <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl overflow-hidden">
          <CardContent className="p-0">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-16">
                <img src="/images/icon-team.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-bold text-[#0A0A0A] mb-1">
                  {searchQuery ? 'No students found' : 'No students in this trip yet'}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {!searchQuery && 'Add students individually or import from a CSV file'}
                </p>
                {!searchQuery && (
                  <div className="flex justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCSVModal(true)}
                      className="border-2 border-[#0A0A0A] rounded-xl"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                    <Button
                      onClick={() => setShowAddModal(true)}
                      className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-semibold rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0A0A0A] text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Permission Slip
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredStudents.map((student) => {
                      const status = getPermissionSlipStatus(student);
                      
                      const statusStyles = {
                        green: 'bg-green-100 text-green-700 border-green-300',
                        blue: 'bg-blue-100 text-blue-700 border-blue-300',
                        red: 'bg-red-100 text-red-700 border-red-300',
                        gray: 'bg-gray-100 text-gray-600 border-gray-300',
                      };
                      
                      return (
                        <tr key={student.id} className="hover:bg-[#F5C518]/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-[#0A0A0A]">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-xs text-gray-500 sm:hidden">Grade {student.grade}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            <span className="text-sm text-gray-600">{student.grade}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles[status.color as keyof typeof statusStyles]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                status.color === 'green' ? 'bg-green-500' :
                                status.color === 'blue' ? 'bg-blue-500' :
                                status.color === 'red' ? 'bg-red-500' :
                                'bg-gray-400'
                              }`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setEditingStudent(student)}
                                className="p-1.5 text-gray-500 hover:text-[#0A0A0A] hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit student"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveStudent(student.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove student"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
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
      </div>
      
      {showAddModal && (
        <AddStudentModal
          tripId={tripId!}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchTripAndStudents();
          }}
        />
      )}
      
      {showCSVModal && (
        <CSVImportModal
          tripId={tripId!}
          onClose={() => setShowCSVModal(false)}
          onSuccess={() => {
            setShowCSVModal(false);
            fetchTripAndStudents();
          }}
        />
      )}
      
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            setEditingStudent(null);
            fetchTripAndStudents();
          }}
        />
      )}
    </Layout>
  );
}
