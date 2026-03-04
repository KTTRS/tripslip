import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users } from 'lucide-react';
import { Button } from '@tripslip/ui/components/button';
import { Badge } from '@tripslip/ui/components/badge';
import { Card, CardContent } from '@tripslip/ui/components/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@tripslip/ui/components/dialog';
import type { VenueBooking } from '@tripslip/database';

interface BookingCalendarProps {
  bookings: VenueBooking[];
  onBookingClick?: (booking: VenueBooking) => void;
}

export function BookingCalendar({ bookings, onBookingClick }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<VenueBooking[]>([]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.scheduled_date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'modified':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'error' | 'outline' | 'yellow' | 'black' | 'inactive'> = {
      pending: 'yellow',
      confirmed: 'success',
      completed: 'default',
      cancelled: 'error',
      modified: 'outline'
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleDateClick = (date: Date) => {
    const dayBookings = getBookingsForDate(date);
    if (dayBookings.length > 0) {
      setSelectedDate(date);
      setSelectedBookings(dayBookings);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold font-['Fraunces']">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="border-2 border-black hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="border-2 border-black hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border-2 border-black rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-100 border-b-2 border-black">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center font-semibold font-['Plus_Jakarta_Sans']">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayBookings = getBookingsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                  ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''}
                  ${dayBookings.length > 0 ? 'hover:bg-yellow-50' : ''}
                `}
                onClick={() => handleDateClick(day)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`
                    text-sm font-semibold font-['Space_Mono']
                    ${isTodayDate ? 'text-blue-600' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-xs bg-[#F5C518] text-black px-1 py-0.5 rounded font-semibold">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Booking Indicators */}
                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((booking, idx) => (
                    <div
                      key={booking.id}
                      className="text-xs p-1 rounded border border-gray-300 bg-white truncate"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookingClick?.(booking);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(booking.status)}`} />
                        <span className="truncate font-['Plus_Jakarta_Sans']">
                          {booking.start_time} - {booking.student_count} students
                        </span>
                      </div>
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-gray-500 font-['Plus_Jakarta_Sans']">
                      +{dayBookings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm font-['Plus_Jakarta_Sans']">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>Modified</span>
        </div>
      </div>

      {/* Day Detail Modal */}
      <Dialog open={selectedDate !== null} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Fraunces'] text-2xl font-bold">
              Bookings for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription className="font-['Plus_Jakarta_Sans']">
              {selectedBookings.length} booking(s) scheduled for this date
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedBookings.map((booking) => (
              <Card key={booking.id} className="border-2 border-black">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold font-['Plus_Jakarta_Sans']">
                          Booking #{booking.confirmation_number}
                        </h4>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{booking.start_time} - {booking.end_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{booking.student_count} students, {booking.chaperone_count} chaperones</span>
                        </div>
                        {booking.special_requirements && (
                          <div className="mt-2">
                            <span className="font-semibold">Special Requirements:</span>
                            <p className="text-xs mt-1">{booking.special_requirements}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBookingClick?.(booking)}
                      className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}