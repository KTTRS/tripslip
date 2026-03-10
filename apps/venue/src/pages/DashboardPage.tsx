import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Layout } from '../components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui'
import { MetricCard } from '@tripslip/ui'
import { useVenueAnalytics } from '../hooks/useVenueAnalytics'
import { useVenue } from '../contexts/AuthContext'
import { RevenueTrendChart } from '../components/RevenueTrendChart'
import { UpcomingBookings } from '../components/UpcomingBookings'
import { AnalyticsFilters } from '../components/AnalyticsFilters'
import { exportAnalyticsToCSV } from '../utils/csvExport'
import { Plus, MapPin, FileText, Settings } from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { venue, venueId, venueLoading } = useVenue()
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>(undefined)
  const [selectedExperience, setSelectedExperience] = useState<string | undefined>(undefined)
  const { analytics, loading, error } = useVenueAnalytics(dateRange, selectedExperience)

  const handleExportCSV = () => {
    if (analytics) {
      exportAnalyticsToCSV(analytics, dateRange)
    }
  }

  if (venueLoading || loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F5C518] border-t-[#0A0A0A]"></div>
          <p className="text-gray-600 font-semibold font-['Plus_Jakarta_Sans']">Loading dashboard...</p>
        </div>
      </Layout>
    )
  }

  if (!venueId || !venue) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center bg-white">
            <img src="/images/char-green-octagon.png" alt="" className="w-24 h-24 mx-auto mb-6 object-contain" />
            <h2 className="text-3xl font-bold font-['Fraunces'] text-[#0A0A0A] mb-3">Welcome to TripSlip!</h2>
            <p className="text-gray-600 font-['Plus_Jakarta_Sans'] mb-8">
              Your account isn't linked to a venue yet. Contact support to get set up, or check that you're using the correct login.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-['Plus_Jakarta_Sans']"
            >
              <Settings className="inline h-5 w-5 mr-2" />
              Go to Profile
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const hasData = analytics && analytics.totalBookings > 0

  return (
    <Layout>
      <div className="space-y-8">
        <div className="relative rounded-2xl border-2 border-black bg-gradient-to-r from-[#F5C518]/10 via-white to-emerald-50 p-6 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <img
                src="/images/char-green-octagon.png"
                alt="TripSlip Venue mascot"
                className="w-16 h-16 animate-bounce-slow hidden sm:block"
              />
              <div>
                <h2 className="text-3xl font-bold font-['Fraunces']">{venue.name}</h2>
                <p className="text-gray-600 mt-1 font-['Plus_Jakarta_Sans']">Welcome back! Here's your venue overview.</p>
              </div>
            </div>
            {hasData && (
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-[#F5C518] text-black font-bold border-2 border-black rounded-lg hover:bg-[#F5C518]/80 transition-all shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] hover:shadow-[1px_1px_0px_0px_rgba(10,10,10,1)] hover:translate-x-[1px] hover:translate-y-[1px] font-['Plus_Jakarta_Sans']"
              >
                Export CSV
              </button>
            )}
          </div>
        </div>

        {!hasData ? (
          <div className="space-y-6">
            <Card className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A]">
              <CardContent className="py-12 text-center">
                <img src="/images/icon-magic.png" alt="" className="w-20 h-20 mx-auto mb-4 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
                <h3 className="text-2xl font-bold font-['Fraunces'] text-[#0A0A0A] mb-2">Getting Started</h3>
                <p className="text-gray-600 font-['Plus_Jakarta_Sans'] mb-8 max-w-md mx-auto">
                  Set up your venue profile and create experiences to start receiving trip bookings from teachers.
                </p>
                <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
                  <button
                    onClick={() => navigate('/profile')}
                    className="p-4 border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white"
                  >
                    <Settings className="h-8 w-8 mx-auto mb-2 text-[#0A0A0A]" />
                    <p className="font-bold font-['Plus_Jakarta_Sans'] text-sm">Venue Profile</p>
                    <p className="text-xs text-gray-500 mt-1">Complete your details</p>
                  </button>
                  <button
                    onClick={() => navigate('/experiences/new')}
                    className="p-4 border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white"
                  >
                    <Plus className="h-8 w-8 mx-auto mb-2 text-[#0A0A0A]" />
                    <p className="font-bold font-['Plus_Jakarta_Sans'] text-sm">Create Experience</p>
                    <p className="text-xs text-gray-500 mt-1">Add your first offering</p>
                  </button>
                  <button
                    onClick={() => navigate('/trips')}
                    className="p-4 border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white"
                  >
                    <FileText className="h-8 w-8 mx-auto mb-2 text-[#0A0A0A]" />
                    <p className="font-bold font-['Plus_Jakarta_Sans'] text-sm">View Trips</p>
                    <p className="text-xs text-gray-500 mt-1">See incoming bookings</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total Revenue" value="$0.00" />
              <MetricCard label="Revenue (MTD)" value="$0.00" />
              <MetricCard label="Revenue (YTD)" value="$0.00" />
              <MetricCard label="Total Bookings" value="0" />
            </div>
          </div>
        ) : (
          <>
            <AnalyticsFilters
              onDateRangeChange={setDateRange}
              onExperienceChange={setSelectedExperience}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total Revenue" value={formatCurrency(analytics!.totalRevenue)} />
              <MetricCard label="Revenue (MTD)" value={formatCurrency(analytics!.monthlyRevenue)} />
              <MetricCard label="Revenue (YTD)" value={formatCurrency(analytics!.yearlyRevenue)} />
              <MetricCard label="Total Bookings" value={analytics!.totalBookings.toString()} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <MetricCard label="Confirmed Bookings" value={analytics!.confirmedBookings.toString()} />
              <MetricCard label="Pending Bookings" value={analytics!.pendingBookings.toString()} />
              <MetricCard label="Completed Bookings" value={analytics!.completedBookings.toString()} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <MetricCard label="Avg Booking Value" value={formatCurrency(analytics!.averageBookingValue)} />
              <MetricCard label="Avg Student Count" value={analytics!.averageStudentCount.toFixed(1)} />
            </div>

            <RevenueTrendChart />

            <div className="grid gap-6 lg:grid-cols-2">
              <UpcomingBookings />
              <Card className="border-2 border-black shadow-[4px_4px_0px_#0A0A0A]">
                <CardHeader>
                  <CardTitle>Top Performing Experiences</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics!.topExperiences.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No experiences data available</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics!.topExperiences.map((exp) => (
                        <div key={exp.id} className="flex justify-between items-center p-4 border-2 border-[#0A0A0A] rounded-xl hover:bg-[#F5C518]/5 transition-all">
                          <div>
                            <p className="font-semibold">{exp.title}</p>
                            <p className="text-sm text-gray-600">{exp.bookingCount} bookings</p>
                          </div>
                          <p className="text-lg font-bold">{formatCurrency(exp.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
