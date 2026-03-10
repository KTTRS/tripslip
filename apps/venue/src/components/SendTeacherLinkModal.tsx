import { useState } from 'react';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tripslip/ui/components/dialog';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Copy, Check, Send, Link2 } from 'lucide-react';

interface SendTeacherLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkGenerated?: () => void;
  experienceId: string;
  experienceTitle: string;
}

export function SendTeacherLinkModal({
  open,
  onOpenChange,
  onLinkGenerated,
  experienceId,
  experienceTitle,
}: SendTeacherLinkModalProps) {
  const [teacherEmail, setTeacherEmail] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [studentCount, setStudentCount] = useState('30');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    teacher_link: string;
    parent_link: string;
    teacher_found: boolean;
    teacher_name: string | null;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSend = async () => {
    if (!teacherEmail || !tripDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in again');
        return;
      }

      const response = await fetch('/api/venue/send-teacher-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          experience_id: experienceId,
          teacher_email: teacherEmail,
          trip_date: tripDate,
          student_count: parseInt(studentCount) || 30,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate link');
      }

      setResult(data);
      toast.success('Consent link generated successfully');
      onLinkGenerated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async (link: string, label: string) => {
    const fullUrl = `${window.location.origin}${link}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(label);
    toast.success(`${label} link copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClose = () => {
    setTeacherEmail('');
    setTripDate('');
    setStudentCount('30');
    setResult(null);
    setCopied(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-['Fraunces'] text-2xl font-bold flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Consent Link
          </DialogTitle>
          <DialogDescription className="font-['Plus_Jakarta_Sans']">
            Generate a consent link for <span className="font-semibold">{experienceTitle}</span>. The teacher will receive a link to review the indemnification form and forward it to parents.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="teacher-email" className="font-['Plus_Jakarta_Sans'] font-semibold">
                Teacher Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="teacher-email"
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="e.g. teacher@school.edu"
                className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Plus_Jakarta_Sans'] mt-1"
              />
            </div>
            <div>
              <Label htmlFor="trip-date" className="font-['Plus_Jakarta_Sans'] font-semibold">
                Trip Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="trip-date"
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Plus_Jakarta_Sans'] mt-1"
              />
            </div>
            <div>
              <Label htmlFor="student-count" className="font-['Plus_Jakarta_Sans'] font-semibold">
                Expected Students
              </Label>
              <Input
                id="student-count"
                type="number"
                value={studentCount}
                onChange={(e) => setStudentCount(e.target.value)}
                min={1}
                max={200}
                className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Plus_Jakarta_Sans'] mt-1"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {result.teacher_found && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-semibold">
                  Teacher found: {result.teacher_name}
                </p>
              </div>
            )}
            {!result.teacher_found && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Teacher not yet registered on TripSlip. Share the link directly — they can review it without an account.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="bg-gray-50 border-2 border-black rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teacher Review Link</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(result.teacher_link, 'Teacher')}
                    className="border-2 border-black h-8 gap-1"
                  >
                    {copied === 'Teacher' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === 'Teacher' ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-sm font-mono break-all text-gray-700">
                  {window.location.origin}{result.teacher_link}
                </p>
              </div>

              <div className="bg-gray-50 border-2 border-black rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Direct Parent Link</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(result.parent_link, 'Parent')}
                    className="border-2 border-black h-8 gap-1"
                  >
                    {copied === 'Parent' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === 'Parent' ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-sm font-mono break-all text-gray-700">
                  {window.location.origin}{result.parent_link}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || !teacherEmail || !tripDate}
                className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-['Plus_Jakarta_Sans'] font-bold"
              >
                {sending ? 'Generating...' : 'Generate Consent Link'}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleClose}
              className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black border-2 border-black font-['Plus_Jakarta_Sans'] font-bold"
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
