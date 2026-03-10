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
import { Link2 } from 'lucide-react';

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
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!tripDate) {
      toast.error('Please select a trip date');
      return;
    }

    setGenerating(true);
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
          teacher_email: teacherEmail || null,
          trip_date: tripDate,
          student_count: parseInt(studentCount) || 30,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate link');
      }

      toast.success('Consent link generated! You can now copy it from the experience page.');
      onLinkGenerated?.();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setTeacherEmail('');
    setTripDate('');
    setStudentCount('30');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-['Fraunces'] text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Generate Consent Link
          </DialogTitle>
          <DialogDescription className="font-['Plus_Jakarta_Sans']">
            Create a consent link for <span className="font-semibold">{experienceTitle}</span>. After generating, the link will appear on the experience page for you to copy and send to teachers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
          <div>
            <Label htmlFor="teacher-email" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Teacher Email <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="teacher-email"
              type="email"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              placeholder="e.g. teacher@school.edu"
              className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Plus_Jakarta_Sans'] mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">If you know the teacher's email, enter it here to link the trip to their account.</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || !tripDate}
            className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-['Plus_Jakarta_Sans'] font-bold"
          >
            {generating ? 'Generating...' : 'Generate Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
