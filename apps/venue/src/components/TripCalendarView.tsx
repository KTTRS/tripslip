import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { Button } from '@tripslip/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { VenueTrip } from '../hooks/useVenueTrips'

interface TripCalendarViewProps {
  trips: VenueTrip[]
  onDateClick?: (date: Date, trips: VenueTrip[]) => void
}

export function TripCalendarView({ trips, onDateClick }: TripCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Group trips by date
  const tripsByDate = useMemo(() => {
    const grouped = new Map<string, VenueTrip[]>()
    
    trips.forEach(trip => {
      const dateKey = format(new Date(trip.trip_date), 'yyyy-MM-dd')
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(trip)
    })
    
    return grouped
  }, [trips])

  const getTripsForDate = (date: Date): VenueTrip[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return tripsByDate.get(dateKey) || []
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border-2 border-black rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-100 border-b-2 border-black">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-semibold text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="border border-gray-200 p-2 bg-gray-50 min-h-[100px]" />
          ))}

          {/* Days in month */}
          {daysInMonth.map(day => {
            const dayTrips = getTripsForDate(day)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toISOString()}
                className={`border border-gray-200 p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 transition-colors ${
                  isToday ? 'bg-blue-50' : ''
                }`}
                onClick={() => onDateClick?.(day, dayTrips)}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayTrips.slice(0, 3).map(trip => (
                    <div
                      key={trip.id}
                      className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(trip.status)}`}
                      title={`${trip.experience.title} - ${trip.teacher.first_name} ${trip.teacher.last_name}`}
                    >
                      {trip.experience.title}
                    </div>
                  ))}
                  {dayTrips.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayTrips.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
          <span>Cancelled</span>
        </div>
      </div>
    </div>
  )
}
