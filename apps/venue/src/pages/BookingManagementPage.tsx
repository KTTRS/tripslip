import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Button } from '@tripslip/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tripslip/ui/components/tabs';
import { useVenueBookings } from '../hooks/useVenueBookings';
import { BookingList } from '../components/BookingList';
import { BookingCalendar } from '../components/BookingCalendar';
import { BookingFilters } from '../components/BookingFilters';

export default function BookingManagementPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{
    status?: string;
    experienceId?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  
  const { bookings, loading, error, confirmBooking, cancelBooking, updateBooking } = useVenueBookings(filters);

  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518]"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">Error loading bookings: {error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="relative bg-gradient-to-r from-[#F5C518]/20 via-white to-[#4ECDC4]/20 border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#4ECDC4]/20 border-2 border-[#0A0A0A] flex items-center justify-center p-2">
              <img src="/images/icon-calendar.png" alt="" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#0A0A0A]">Booking Management</h2>
              <p className="text-gray-600 mt-1">
                Manage all your venue bookings and reservations
              </p>
            </div>
          </div>
          <img
            src="/images/char-green-octagon.png"
            alt=""
            className="absolute -right-4 -bottom-4 w-28 h-28 object-contain opacity-20 animate-bounce"
            style={{ animationDuration: '3s' }}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#F5C518]/20 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-compass.png" alt="" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{bookingStats.total}</p>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-megaphone.png" alt="" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{bookingStats.pending}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-shield.png" alt="" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{bookingStats.confirmed}</p>
                  <p className="text-sm text-gray-600">Confirmed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-trophy.png" alt="" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{bookingStats.completed}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-tracking.png" alt="" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{bookingStats.cancelled}</p>
                  <p className="text-sm text-gray-600">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <BookingFilters onFilterChange={setFilters} />

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="border-2 border-[#0A0A0A]">
            <TabsTrigger value="list" className="font-semibold">
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="font-semibold">
              Calendar View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  All Bookings ({bookings.length})
                </CardTitle>
                <CardDescription>
                  Manage and track all venue bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookingList
                  bookings={bookings}
                  onConfirm={confirmBooking}
                  onCancel={cancelBooking}
                  onUpdate={updateBooking}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Booking Calendar
                </CardTitle>
                <CardDescription>
                  View bookings in calendar format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookingCalendar
                  bookings={bookings}
                  onBookingClick={(booking) => {
                    console.log('Booking clicked:', booking);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common booking management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-20 border-2 border-[#0A0A0A] hover:bg-[#F5C518] hover:shadow-[4px_4px_0px_#0A0A0A] transition-all duration-200 font-semibold rounded-xl"
                onClick={() => setFilters({ status: 'pending' })}
              >
                <div className="text-center flex flex-col items-center">
                  <img src="/images/icon-megaphone.png" alt="" className="h-6 w-6 object-contain mb-2" />
                  <p>Review Pending</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-2 border-[#0A0A0A] hover:bg-[#F5C518] hover:shadow-[4px_4px_0px_#0A0A0A] transition-all duration-200 font-semibold rounded-xl"
                onClick={() => navigate('/experiences')}
              >
                <div className="text-center flex flex-col items-center">
                  <img src="/images/icon-venue.png" alt="" className="h-6 w-6 object-contain mb-2" />
                  <p>Manage Experiences</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-2 border-[#0A0A0A] hover:bg-[#F5C518] hover:shadow-[4px_4px_0px_#0A0A0A] transition-all duration-200 font-semibold rounded-xl"
                onClick={() => navigate('/financials')}
              >
                <div className="text-center flex flex-col items-center">
                  <img src="/images/icon-payment.png" alt="" className="h-6 w-6 object-contain mb-2" />
                  <p>View Financials</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}