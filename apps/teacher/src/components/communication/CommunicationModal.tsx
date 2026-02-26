import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@tripslip/ui';
import { createSupabaseClient } from '@tripslip/database';
import type { Tables } from '@tripslip/database';
import { toast } from 'sonner';
import { X, Send, Eye, Mail, MessageSquare, Users } from 'lucide-react';

type Student = Tables<'students'>;
type PermissionSlip = Tables<'permission_slips'>;

interface CommunicationModalProps {
  tripId: string;
  tripTitle: string;
  students: Array<Student & { permission_slip?: PermissionSlip }>;
  onClose: () => void;
  onSuccess: () => void;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'permission_slip_reminder',
    name: 'Permission Slip Reminder',
    subject: 'Reminder: Permission Slip for {tripTitle}',
    body: `Hello {parentName},

This is a friendly reminder that we still need a signed permission slip for {studentName}'s field trip to {tripTitle}.

Trip Date: {tripDate}
Cost: {tripCost}

Please sign the permission slip as soon as possible to ensure {studentName} can attend.

Thank you,
{teacherName}`
  },
  {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    subject: 'Payment Reminder for {tripTitle}',
    body: `Hello {parentName},

Thank you for signing the permission slip for {studentName}'s field trip to {tripTitle}.

We still need to receive payment to complete the registration.

Trip Date: {tripDate}
Amount Due: {tripCost}

Please complete the payment at your earliest convenience.

Thank you,
{teacherName}`
  },
  {
    id: 'trip_update',
    name: 'Trip Update',
    subject: 'Update: {tripTitle}',
    body: `Hello {parentName},

I wanted to share an important update about {studentName}'s upcoming field trip to {tripTitle}.

[Add your update here]

If you have any questions, please don't hesitate to reach out.

Thank you,
{teacherName}`
  }
];

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function CommunicationModal({
  tripId,
  tripTitle,
  students,
  onClose,
  onSuccess
}: CommunicationModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [communicationType, setCommunicationType] = useState<'email' | 'sms' | 'both'>('email');
  const [recipientFilter, setRecipientFilter] = useState<'all_pending' | 'signed_unpaid' | 'all'>('all_pending');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewRecipients, setPreviewRecipients] = useState<any[]>([]);

  useEffect(() => {
    if (selectedTemplate) {
      setSubject(selectedTemplate.subject);
      setMessage(selectedTemplate.body);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    fetchRecipients();
  }, [recipientFilter, students]);

  const fetchRecipients = async () => {
    let filteredStudents = [...students];

    // Apply recipient filter
    if (recipientFilter === 'all_pending') {
      filteredStudents = students.filter(s => {
        const slip = s.permission_slip;
        return !slip || slip.status === 'pending';
      });
    } else if (recipientFilter === 'signed_unpaid') {
      filteredStudents = students.filter(s => {
        const slip = s.permission_slip;
        return slip && slip.status === 'signed';
      });
    }

    // Fetch parent information for each student
    const recipientsWithParents = await Promise.all(
      filteredStudents.map(async (student) => {
        const { data: parents } = await supabase
          .from('student_parents' as any)
          .select(`
            parent:parents (
              id,
              first_name,
              last_name,
              email,
              phone,
              communication_preference
            )
          `)
          .eq('student_id', student.id);

        return {
          student,
          parents: parents?.map((p: any) => p.parent) || []
        };
      })
    );

    setPreviewRecipients(recipientsWithParents);
  };

  const interpolateMessage = (template: string, data: Record<string, string>): string => {
    return template.replace(/\{(\w+)\}/g, (_, key) => data[key] || `{${key}}`);
  };

  const getPreviewMessage = (studentName: string, parentName: string): { subject: string; body: string } => {
    const data = {
      parentName,
      studentName,
      tripTitle,
      tripDate: '[Trip Date]',
      tripCost: '[Trip Cost]',
      teacherName: '[Your Name]'
    };

    return {
      subject: interpolateMessage(subject, data),
      body: interpolateMessage(message, data)
    };
  };

  const handleSendMessages = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please enter both subject and message');
      return;
    }

    if (previewRecipients.length === 0) {
      toast.error('No recipients match the selected filter');
      return;
    }

    setSending(true);

    try {
      let sentCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Get current teacher info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: teacher } = await supabase
        .from('teachers' as any)
        .select('first_name, last_name, email')
        .eq('user_id', user.id)
        .single();

      // Get trip details
      const { data: trip } = await supabase
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

      // Send notifications to each parent
      for (const recipient of previewRecipients) {
        for (const parent of recipient.parents) {
          try {
            // Prepare message data
            const messageData = {
              parentName: `${parent.first_name} ${parent.last_name}`,
              studentName: `${recipient.student.first_name} ${recipient.student.last_name}`,
              tripTitle: trip?.experience?.title || tripTitle,
              tripDate: trip?.experience?.event_date 
                ? new Date(trip.experience.event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : '[Date TBD]',
              tripCost: trip?.experience?.cost_cents 
                ? `$${(trip.experience.cost_cents / 100).toFixed(2)}`
                : '[Cost TBD]',
              teacherName: teacher ? `${(teacher as any).first_name} ${(teacher as any).last_name}` : '[Teacher Name]'
            };

            const finalSubject = interpolateMessage(subject, messageData);
            const finalBody = interpolateMessage(message, messageData);

            // Determine channel based on parent preference and selected type
            let channel = communicationType;
            if (communicationType === 'both') {
              channel = parent.communication_preference || 'email';
            } else if (communicationType === 'email' && parent.communication_preference === 'sms') {
              channel = 'sms';
            } else if (communicationType === 'sms' && parent.communication_preference === 'email') {
              channel = 'email';
            }

            // Log communication in database
            const { error: notificationError } = await supabase
              .from('notifications' as any)
              .insert({
                user_id: parent.id,
                user_type: 'parent',
                channel: channel,
                subject: finalSubject,
                body: finalBody,
                status: 'pending',
                is_critical: false,
                metadata: {
                  trip_id: tripId,
                  student_id: recipient.student.id,
                  teacher_id: (teacher as any)?.id || user.id,
                  template_id: selectedTemplate?.id
                }
              });

            if (notificationError) throw notificationError;

            // Call Edge Function to send notification
            const { error: sendError } = await supabase.functions.invoke('send-notification', {
              body: {
                userId: parent.id,
                userType: 'parent',
                channel: channel,
                templateName: 'custom',
                language: 'en',
                data: {
                  subject: finalSubject,
                  body: finalBody
                },
                isCritical: false
              }
            });

            if (sendError) {
              throw sendError;
            }

            sentCount++;
          } catch (error: any) {
            console.error('Error sending to parent:', parent.email, error);
            failedCount++;
            errors.push(`Failed to send to ${parent.email}: ${error?.message || 'Unknown error'}`);
          }
        }
      }

      // Show results
      if (sentCount > 0) {
        toast.success(`Successfully sent ${sentCount} message${sentCount > 1 ? 's' : ''}`);
      }

      if (failedCount > 0) {
        toast.error(`Failed to send ${failedCount} message${failedCount > 1 ? 's' : ''}`);
        console.error('Send errors:', errors);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending messages:', error);
      toast.error('Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="border-2 border-black shadow-offset max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b-2 border-black">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Send Communication</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{tripTitle}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-2 border-black"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {!showPreview ? (
            <>
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Template
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {MESSAGE_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-black bg-gray-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {template.subject.substring(0, 40)}...
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Recipients
                </label>
                <select
                  value={recipientFilter}
                  onChange={(e) => setRecipientFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border-2 border-black rounded-md bg-white font-medium"
                >
                  <option value="all_pending">Parents with Pending Slips</option>
                  <option value="signed_unpaid">Parents with Signed but Unpaid Slips</option>
                  <option value="all">All Parents</option>
                </select>
                <p className="text-sm text-gray-600 mt-1">
                  {previewRecipients.length} student{previewRecipients.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              {/* Communication Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Method
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCommunicationType('email')}
                    className={`flex-1 p-3 border-2 rounded-lg transition-colors ${
                      communicationType === 'email'
                        ? 'border-black bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Mail className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Email</div>
                  </button>
                  <button
                    onClick={() => setCommunicationType('sms')}
                    className={`flex-1 p-3 border-2 rounded-lg transition-colors ${
                      communicationType === 'sms'
                        ? 'border-black bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <MessageSquare className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">SMS</div>
                  </button>
                  <button
                    onClick={() => setCommunicationType('both')}
                    className={`flex-1 p-3 border-2 rounded-lg transition-colors ${
                      communicationType === 'both'
                        ? 'border-black bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-center gap-1 mb-1">
                      <Mail className="h-4 w-4" />
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium">Both</div>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Parent preferences will be respected
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <Input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter message subject"
                  className="border-2 border-black"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message"
                  rows={10}
                  className="w-full px-4 py-2 border-2 border-black rounded-md font-mono text-sm"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Available variables: {'{parentName}'}, {'{studentName}'}, {'{tripTitle}'}, {'{tripDate}'}, {'{tripCost}'}, {'{teacherName}'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-black">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-2 border-black"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  className="border-2 border-black"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Preview Mode */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Message Preview</h3>
                
                {/* Preview for first recipient */}
                {previewRecipients.length > 0 && previewRecipients[0].parents.length > 0 && (
                  <div className="border-2 border-black rounded-lg p-4 bg-gray-50 mb-4">
                    <div className="text-sm text-gray-600 mb-2">
                      Preview for: {previewRecipients[0].parents[0].first_name} {previewRecipients[0].parents[0].last_name}
                    </div>
                    <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                      <div className="font-semibold mb-2">
                        Subject: {getPreviewMessage(
                          `${previewRecipients[0].student.first_name} ${previewRecipients[0].student.last_name}`,
                          `${previewRecipients[0].parents[0].first_name} ${previewRecipients[0].parents[0].last_name}`
                        ).subject}
                      </div>
                      <div className="whitespace-pre-wrap text-sm">
                        {getPreviewMessage(
                          `${previewRecipients[0].student.first_name} ${previewRecipients[0].student.last_name}`,
                          `${previewRecipients[0].parents[0].first_name} ${previewRecipients[0].parents[0].last_name}`
                        ).body}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recipients List */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2">
                    Recipients ({previewRecipients.reduce((sum, r) => sum + r.parents.length, 0)} total)
                  </h4>
                  <div className="max-h-48 overflow-y-auto border-2 border-black rounded-lg">
                    {previewRecipients.map((recipient) => (
                      <div key={recipient.student.id} className="p-3 border-b border-gray-200 last:border-b-0">
                        <div className="font-medium">
                          {recipient.student.first_name} {recipient.student.last_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {recipient.parents.map((p: any) => `${p.first_name} ${p.last_name} (${p.email})`).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirmation */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Ready to send?</strong> This will send {previewRecipients.reduce((sum, r) => sum + r.parents.length, 0)} message{previewRecipients.reduce((sum, r) => sum + r.parents.length, 0) !== 1 ? 's' : ''} via {communicationType}.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-black">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="border-2 border-black"
                  disabled={sending}
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={handleSendMessages}
                  disabled={sending}
                  className="shadow-offset"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Messages
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
