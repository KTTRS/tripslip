import { useState, useEffect } from 'react';
import { Button } from '@tripslip/ui';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { X, Copy, Check, Link2, MessageSquare, Send } from 'lucide-react';

interface StudentInfo {
  id: string;
  first_name: string;
  last_name: string;
  parents: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  }>;
}

interface TripOption {
  id: string;
  label: string;
  trip_date: string;
  direct_link_token: string;
}

interface SendLinksModalProps {
  students: StudentInfo[];
  onClose: () => void;
  onSuccess: () => void;
}

export function SendLinksModal({ students, onClose, onSuccess }: SendLinksModalProps) {
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tripLink, setTripLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [smsResults, setSmsResults] = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacher) return;

      const { data: tripsData } = await supabase
        .from('trips')
        .select('id, trip_date, direct_link_token, experience:experiences(title)')
        .eq('teacher_id', teacher.id)
        .in('status', ['draft', 'pending_approval', 'approved', 'confirmed'])
        .order('trip_date', { ascending: true });

      const options = (tripsData || []).map((t: any) => ({
        id: t.id,
        label: `${t.experience?.title || 'Untitled Trip'} — ${new Date(t.trip_date).toLocaleDateString()}`,
        trip_date: t.trip_date,
        direct_link_token: t.direct_link_token || '',
      }));

      setTrips(options);
      if (options.length > 0) {
        setSelectedTrip(options[0].id);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    if (!selectedTrip) {
      toast.error('Please select a trip');
      return;
    }

    setGenerating(true);

    try {
      const trip = trips.find(t => t.id === selectedTrip);
      if (!trip) return;

      let token = trip.direct_link_token;
      if (!token) {
        token = crypto.randomUUID();
        await supabase
          .from('trips')
          .update({ direct_link_token: token })
          .eq('id', selectedTrip);
        trip.direct_link_token = token;
      }

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/parent/trip/${token}`;
      setTripLink(link);
      toast.success('Link ready!');
    } catch (err) {
      console.error('Error generating link:', err);
      toast.error('Failed to generate link');
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!tripLink) return;
    try {
      await navigator.clipboard.writeText(tripLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const copyWithMessage = async () => {
    if (!tripLink) return;
    const trip = trips.find(t => t.id === selectedTrip);
    const message = `Hi! Please sign the permission slip for ${trip?.label || 'the upcoming field trip'}. Find your child and sign here: ${tripLink}`;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success('Message with link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const sendSMSToAll = async () => {
    if (!tripLink) return;

    const parentsWithPhones = students.flatMap(s =>
      s.parents
        .filter(p => p.phone)
        .map(p => ({
          phone: p.phone!,
          parentName: p.first_name,
          studentName: `${s.first_name} ${s.last_name}`,
        }))
    );

    if (parentsWithPhones.length === 0) {
      toast.error('No parents have phone numbers on file');
      return;
    }

    setSendingSMS(true);
    let sent = 0;
    let failed = 0;

    const trip = trips.find(t => t.id === selectedTrip);

    for (const parent of parentsWithPhones) {
      try {
        const res = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: parent.phone,
            message: `Hi ${parent.parentName}! Please sign ${parent.studentName}'s permission slip for ${trip?.label || 'the field trip'}: ${tripLink}`,
          }),
        });

        if (res.ok) {
          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setSmsResults({ sent, failed });
    setSendingSMS(false);
    if (sent > 0) {
      toast.success(`Sent ${sent} text message${sent !== 1 ? 's' : ''}`);
    }
    if (failed > 0) {
      toast.error(`${failed} message${failed !== 1 ? 's' : ''} failed to send`);
    }
  };

  const parentsWithPhones = students.flatMap(s =>
    s.parents.filter(p => p.phone)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b-2 border-[#0A0A0A] sticky top-0 bg-white rounded-t-xl z-10">
          <div>
            <h2 className="text-xl font-bold text-[#0A0A0A]">Send Permission Slip Link</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              One link for all {students.length} student{students.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {!tripLink ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">
                  Which trip is this for?
                </label>
                {loading ? (
                  <div className="text-gray-500 text-sm">Loading trips...</div>
                ) : trips.length === 0 ? (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-sm text-yellow-800">
                    You don't have any active trips. Create a trip first, then come back to send permission slips.
                  </div>
                ) : (
                  <select
                    value={selectedTrip}
                    onChange={(e) => setSelectedTrip(e.target.value)}
                    className="w-full border-2 border-[#0A0A0A] rounded-lg px-3 py-2.5 text-sm bg-white"
                  >
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2">Students on this trip:</h3>
                <div className="flex flex-wrap gap-2">
                  {students.map((s) => (
                    <span
                      key={s.id}
                      className="bg-white border border-gray-300 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {s.first_name} {s.last_name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                This will create <strong>one link</strong> for the entire class. Parents open the link, find their child's name, and sign the permission slip.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose} className="border-2 border-[#0A0A0A]">
                  Cancel
                </Button>
                <Button
                  onClick={generateLink}
                  disabled={generating || !selectedTrip || trips.length === 0}
                  className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-semibold"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  {generating ? 'Setting up...' : 'Generate Link'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#F5C518]/10 border-2 border-[#F5C518] rounded-lg p-4">
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">
                  Your permission slip link:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border-2 border-[#0A0A0A] rounded-lg px-3 py-2.5 text-sm font-mono text-[#0A0A0A] truncate select-all">
                    {tripLink}
                  </div>
                  <button
                    onClick={copyLink}
                    className="flex-shrink-0 p-2.5 bg-[#0A0A0A] text-white rounded-lg hover:bg-gray-800 transition-colors"
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#0A0A0A]">Share this link:</p>

                <button
                  onClick={copyWithMessage}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-[#F5C518] hover:bg-[#F5C518]/5 transition-all text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Copy className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#0A0A0A]">Copy with Message</p>
                    <p className="text-xs text-gray-500">Ready to paste into Remind, ClassDojo, or email</p>
                  </div>
                </button>

                <button
                  onClick={sendSMSToAll}
                  disabled={sendingSMS || parentsWithPhones.length === 0}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                    parentsWithPhones.length === 0
                      ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                      : smsResults
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    smsResults ? 'bg-green-200' : 'bg-green-100'
                  }`}>
                    {sendingSMS ? (
                      <div className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : smsResults ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#0A0A0A]">
                      {sendingSMS
                        ? 'Sending text messages...'
                        : smsResults
                        ? `Sent to ${smsResults.sent} parent${smsResults.sent !== 1 ? 's' : ''}`
                        : `Text ${parentsWithPhones.length} Parent${parentsWithPhones.length !== 1 ? 's' : ''}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {smsResults
                        ? smsResults.failed > 0
                          ? `${smsResults.failed} failed`
                          : 'All messages delivered'
                        : parentsWithPhones.length === 0
                        ? 'No phone numbers on file'
                        : 'Send via SMS to parents with phone numbers'}
                    </p>
                  </div>
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
                <strong>How it works:</strong> Parents open the link, search for their child's name, and fill out the permission slip — all from their phone.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <Button
                  onClick={() => {
                    onSuccess();
                    toast.success('Done!');
                  }}
                  className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-semibold"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
