import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
  Label
} from '@tripslip/ui';
import type { VenueBooking } from '@tripslip/database';
import { Clock, Users, MapPin, Phone, Mail, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface BookingListProps {
  bookings: VenueBooking[];
  onConfirm: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  onCancel: (bookingId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (bookingId: string, updates: any) => Promise<{ success: boolean; error?: string }>;
}

export function BookingList({ bookings, onConfirm, onCancel, onUpdate }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<VenueBooking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'error' | 'outline' | 'yellow' | 'black' | 'inactive'> = {
      pending: 'yellow',
      confirmed: 'success',
      completed: 'default',
      cancelled: 'error',
      modified: 'outline'
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <AlertCircle className="h-3 w-3" />,
      confirmed: <CheckCircle className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      cancelled: <XCircle className="h-3 w-3" />,
      modified: <AlertCircle className="h-3 w-3" />
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleConfirm = async (booking: VenueBooking) => {
    if (!confirm(`Confirm booking ${booking.confirmation_number}?`)) {
      return;
    }

    setLoading(true);
    const result = await onConfirm(booking.id);
    setLoading(false);

    if (result.success) {
      alert('Booking confirmed successfully!');
    } else {
      alert(`Failed to confirm booking: ${result.error}`);
    }
  };

  const handleCancelSubmit = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      alert('Please provide a reason for cancelling');
      return;
    }

    setLoading(true);
    const result = await onCancel(selectedBooking.id, cancelReason);
    setLoading(false);

    if (result.success) {
      alert('Booking cancelled successfully');
      setShowCancelDialog(false);
      setCancelReason('');
      setSelectedBooking(null);
    } else {
      alert(`Failed to cancel booking: ${result.error}`);
    }
  };

  const handleAddNoteSubmit = async () => {
    if (!selectedBooking || !note.trim()) {
      alert('Please enter a note');
      return;
    }

    setLoading(true);
    const result = await onUpdate(selectedBooking.id, { venue_notes: note });
    setLoading(false);

    if (result.success) {
      alert('Note added successfully');
      setShowNoteDialog(false);
      setNote('');
      setSelectedBooking(null);
    } else {
      alert(`Failed to add note: ${result.error}`);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="font-['Plus_Jakarta_Sans']">No bookings found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-black">
              <TableHead className="font-['Plus_Jakarta_Sans'] font-bold">Date & Time</TableHead>
              <TableHead className="font-['Plus_Jakarta_Sans'] font-bold">Confirmation #</TableHead>
              <TableHead className="font-['Plus_Jakarta_Sans'] font-bold">Capacity</TableHead>
              <TableHead className="font-['Plus_Jakarta_Sans'] font-bold">Amount</TableHead>
              <TableHead className="font-['Plus_Jakarta_Sans'] font-bold">Status</TableHead>
              <TableHead className="font-['Plus_Jakarta_Sans'] font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id} className="border-b border-gray-200 hover:bg-gray-50">
                <TableCell className="font-['Space_Mono'] text-sm">
                  <div>{format(new Date(booking.scheduled_date), 'MMM dd, yyyy')}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {booking.start_time} - {booking.end_time}
                  </div>
                </TableCell>
                
                <TableCell className="font-['Space_Mono'] font-semibold">
                  {booking.confirmation_number}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="font-['Space_Mono']">
                      {booking.student_count}s + {booking.chaperone_count}c
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="font-['Space_Mono'] font-semibold">
                  {formatCurrency(booking.quoted_price_cents)}
                  {booking.deposit_cents && (
                    <div className="text-xs text-gray-500">
                      Deposit: {formatCurrency(booking.deposit_cents)}
                    </div>
                  )}
                </TableCell>
                
                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                
                <TableCell>
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(booking)}
                          disabled={loading}
                          className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black border-2 border-black font-['Plus_Jakarta_Sans'] font-semibold"
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowCancelDialog(true);
                          }}
                          disabled={loading}
                          className="border-2 border-black hover:bg-red-50 font-['Plus_Jakarta_Sans'] font-semibold"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setNote(booking.venue_notes || '');
                        setShowNoteDialog(true);
                      }}
                      disabled={loading}
                      className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
                    >
                      Note
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]">
          <DialogHeader>
            <DialogTitle className="font-['Fraunces'] text-2xl font-bold">
              Cancel Booking
            </DialogTitle>
            <DialogDescription className="font-['Plus_Jakarta_Sans']">
              Please provide a reason for cancelling booking {selectedBooking?.confirmation_number}. 
              The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason" className="font-['Plus_Jakarta_Sans'] font-semibold">
                Reason for cancelling
              </Label>
              <Textarea
                id="reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Venue closed for maintenance, fully booked..."
                rows={4}
                className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Plus_Jakarta_Sans']"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason('');
                setSelectedBooking(null);
              }}
              className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCancelSubmit}
              disabled={loading || !cancelReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white border-2 border-black font-['Plus_Jakarta_Sans'] font-bold"
            >
              {loading ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]">
          <DialogHeader>
            <DialogTitle className="font-['Fraunces'] text-2xl font-bold">
              Venue Notes
            </DialogTitle>
            <DialogDescription className="font-['Plus_Jakarta_Sans']">
              Add or update internal notes for booking {selectedBooking?.confirmation_number}. 
              These notes are only visible to venue staff.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note" className="font-['Plus_Jakarta_Sans'] font-semibold">
                Note
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter your note here..."
                rows={4}
                className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Plus_Jakarta_Sans']"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNoteDialog(false);
                setNote('');
                setSelectedBooking(null);
              }}
              className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNoteSubmit}
              disabled={loading}
              className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] font-['Plus_Jakarta_Sans'] font-bold"
            >
              {loading ? 'Saving...' : 'Save Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
