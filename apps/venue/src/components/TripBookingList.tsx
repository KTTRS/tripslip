import { useState } from 'react'
import { format } from 'date-fns'
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
} from '@tripslip/ui'
import type { VenueTrip } from '../hooks/useVenueTrips'
import { CapacityDisplay } from './CapacityDisplay'
import { useExperienceCapacity } from '../hooks/useExperienceCapacity'

interface TripBookingListProps {
  trips: VenueTrip[]
  onConfirm: (tripId: string) => Promise<{ success: boolean; error?: string }>
  onDecline: (tripId: string, reason: string) => Promise<{ success: boolean; error?: string }>
  onAddNote: (tripId: string, note: string) => Promise<{ success: boolean; error?: string }>
}

function TripCapacityCell({ trip }: { trip: VenueTrip }) {
  const { capacityInfo, loading } = useExperienceCapacity({
    experienceId: trip.experience_id,
    date: trip.trip_date,
    startTime: trip.trip_time,
    endTime: trip.trip_time, // Simplified - would need end time from booking
    enabled: true,
  });

  if (loading) {
    return <TableCell className="text-sm text-gray-500">Loading...</TableCell>;
  }

  if (!capacityInfo) {
    return <TableCell className="text-sm text-gray-500">-</TableCell>;
  }

  return (
    <TableCell>
      <CapacityDisplay
        totalCapacity={capacityInfo.totalCapacity}
        bookedCount={capacityInfo.bookedCount}
      />
    </TableCell>
  );
}

export function TripBookingList({ trips, onConfirm, onDecline, onAddNote }: TripBookingListProps) {
  const [selectedTrip, setSelectedTrip] = useState<VenueTrip | null>(null)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'error' | 'outline' | 'yellow' | 'black' | 'inactive'> = {
      pending: 'yellow',
      confirmed: 'success',
      completed: 'default',
      cancelled: 'error'
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleConfirm = async (trip: VenueTrip) => {
    if (!confirm(`Confirm booking for ${trip.teacher.first_name} ${trip.teacher.last_name}?`)) {
      return
    }

    setLoading(true)
    const result = await onConfirm(trip.id)
    setLoading(false)

    if (result.success) {
      alert('Trip confirmed successfully!')
    } else {
      alert(`Failed to confirm trip: ${result.error}`)
    }
  }

  const handleDeclineSubmit = async () => {
    if (!selectedTrip || !declineReason.trim()) {
      alert('Please provide a reason for declining')
      return
    }

    setLoading(true)
    const result = await onDecline(selectedTrip.id, declineReason)
    setLoading(false)

    if (result.success) {
      alert('Trip declined successfully')
      setShowDeclineDialog(false)
      setDeclineReason('')
      setSelectedTrip(null)
    } else {
      alert(`Failed to decline trip: ${result.error}`)
    }
  }

  const handleAddNoteSubmit = async () => {
    if (!selectedTrip || !note.trim()) {
      alert('Please enter a note')
      return
    }

    setLoading(true)
    const result = await onAddNote(selectedTrip.id, note)
    setLoading(false)

    if (result.success) {
      alert('Note added successfully')
      setShowNoteDialog(false)
      setNote('')
      setSelectedTrip(null)
    } else {
      alert(`Failed to add note: ${result.error}`)
    }
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No trips found</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-black">
              <TableHead>Date & Time</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id} className="border-b border-gray-200">
                <TableCell className="font-mono text-sm">
                  <div>{format(new Date(trip.trip_date), 'MMM dd, yyyy')}</div>
                  {trip.trip_time && (
                    <div className="text-xs text-gray-500">{trip.trip_time}</div>
                  )}
                </TableCell>
                <TableCell>{trip.experience.title}</TableCell>
                <TableCell>{trip.teacher.school?.name || 'Independent'}</TableCell>
                <TableCell>
                  <div>{trip.teacher.first_name} {trip.teacher.last_name}</div>
                  <div className="text-xs text-gray-500">{trip.teacher.email}</div>
                </TableCell>
                <TableCell>{trip.student_count}</TableCell>
                <TripCapacityCell trip={trip} />
                <TableCell>{getStatusBadge(trip.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {trip.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(trip)}
                          disabled={loading}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedTrip(trip)
                            setShowDeclineDialog(true)
                          }}
                          disabled={loading}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTrip(trip)
                        setShowNoteDialog(true)
                      }}
                      disabled={loading}
                    >
                      Add Note
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Booking</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this booking. The teacher will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for declining</Label>
              <Textarea
                id="reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., Fully booked, venue closed for maintenance..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclineDialog(false)
                setDeclineReason('')
                setSelectedTrip(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeclineSubmit}
              disabled={loading || !declineReason.trim()}
            >
              {loading ? 'Declining...' : 'Decline Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Internal Note</DialogTitle>
            <DialogDescription>
              Add a note for internal reference. This will not be visible to the teacher.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter your note here..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNoteDialog(false)
                setNote('')
                setSelectedTrip(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNoteSubmit}
              disabled={loading || !note.trim()}
            >
              {loading ? 'Adding...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
