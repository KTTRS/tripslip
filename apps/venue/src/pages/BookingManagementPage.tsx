import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Button } from '@tripslip/ui/components/button';
import { Badge } from '@tripslip/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tripslip/ui/components/tabs';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tripslip/ui/components/select';
import { Calendar, Clock, Users, MapPin, Phone, Mail, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useVenueBookings } from '../hooks/useVenueBookings';
import { BookingList } from '../components/BookingList';
import { BookingCalendar } from '../components/BookingCalendar';
import { BookingFilters } from '../components/BookingFilters';
import { format } from 'date-fns';

export default function BookingManagementPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{
    status?: string;
    experienceId?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  
  const { bookings, loading, error, confirmBooking, cancelBooking, updateBooking } = useVenueBookings(filters);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
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
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold font-['Fraunces']">Booking Management</h2>
            <p className="text-gray-600 mt-2 font-['Plus_Jakarta_Sans']">
              Manage all your venue bookings and reservations
            </p>
          </div>
        </div>

        {/* Booking Statistics */}
        <div className="grid gap-6 md:grid-cols-5">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold font-['Space_Mono']">{bookingStats.total}</p>
                  <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold font-['Space_Mono']">{bookingStats.pending}</p>
                  <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold font-['Space_Mono']">{bookingStats.confirmed}</p>
                  <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">Confirmed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold font-['Space_Mono']">{bookingStats.completed}</p>
                  <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold font-['Space_Mono']">{bookingStats.cancelled}</p>
                  <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <BookingFilters onFilterChange={setFilters} />

        {/* Booking Views */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="border-2 border-black">
            <TabsTrigger value="list" className="font-['Plus_Jakarta_Sans'] font-semibold">
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Calendar View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
              <CardHeader>
                <CardTitle className="font-['Fraunces'] text-2xl font-bold">
                  All Bookings ({bookings.length})
                </CardTitle>
                <CardDescription className="font-['Plus_Jakarta_Sans']">
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
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
              <CardHeader>
                <CardTitle className="font-['Fraunces'] text-2xl font-bold">
                  Booking Calendar
                </CardTitle>
                <CardDescription className="font-['Plus_Jakarta_Sans']">
                  View bookings in calendar format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookingCalendar
                  bookings={bookings}
                  onBookingClick={(booking) => {
                    // Navigate to booking detail or open modal
                    console.log('Booking clicked:', booking);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
          <CardHeader>
            <CardTitle className="font-['Fraunces'] text-2xl font-bold">
              Quick Actions
            </CardTitle>
            <CardDescription className="font-['Plus_Jakarta_Sans']">
              Common booking management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-20 border-2 border-black hover:bg-[#F5C518] hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] transition-all duration-200 font-['Plus_Jakarta_Sans'] font-semibold"
                onClick={() => setFilters({ status: 'pending' })}
              >
                <div className="text-center">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p>Review Pending</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-2 border-black hover:bg-[#F5C518] hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] transition-all duration-200 font-['Plus_Jakarta_Sans'] font-semibold"
                onClick={() => navigate('/experiences')}
              >
                <div className="text-center">
                  <MapPin className="h-6 w-6 mx-auto mb-2" />
                  <p>Manage Experiences</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-2 border-black hover:bg-[#F5C518] hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] transition-all duration-200 font-['Plus_Jakarta_Sans'] font-semibold"
                onClick={() => navigate('/financials')}
              >
                <div className="text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2" />
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