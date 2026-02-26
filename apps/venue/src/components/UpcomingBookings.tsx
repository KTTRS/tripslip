import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui'
import { useUpcomingBookings } from '../hooks/useUpcomingBookings'

export function UpcomingBookings() {
  const { bookings, loading, error } = useUpcomingBookings(5)

  if (loading) {
    return (
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="border-2 border-black shadow-offset">
      <CardHeader>
        <CardTitle>Upcoming Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No upcoming bookings</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex justify-between items-start p-4 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-semibold">{booking.experience.title}</p>
                  <p className="text-sm text-gray-600">
                    {booking.school?.name || 'Independent'} - {booking.teacher.firstName} {booking.teacher.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{booking.studentCount} students</p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">{formatDate(booking.tripDate)}</p>
                  {booking.tripTime && (
                    <p className="text-sm font-mono text-gray-600">{formatTime(booking.tripTime)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
