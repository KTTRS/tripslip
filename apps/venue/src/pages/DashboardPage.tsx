import { useState } from 'react'
import { Layout } from '../components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui'
import { MetricCard } from '@tripslip/ui'
import { useVenueAnalytics } from '../hooks/useVenueAnalytics'
import { RevenueTrendChart } from '../components/RevenueTrendChart'
import { UpcomingBookings } from '../components/UpcomingBookings'
import { AnalyticsFilters } from '../components/AnalyticsFilters'
import { exportAnalyticsToCSV } from '../utils/csvExport'

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>(undefined)
  const [selectedExperience, setSelectedExperience] = useState<string | undefined>(undefined)
  const { analytics, loading, error } = useVenueAnalytics(dateRange, selectedExperience)

  const handleExportCSV = () => {
    if (analytics) {
      exportAnalyticsToCSV(analytics, dateRange)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518]"></div>
          <p className="text-gray-600 font-semibold">Loading analytics...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">Error loading analytics: {error}</p>
        </div>
      </Layout>
    )
  }

  if (!analytics) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">No analytics data available</p>
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
                <h2 className="text-3xl font-bold font-['Fraunces']">Dashboard</h2>
                <p className="text-gray-600 mt-1 font-['Plus_Jakarta_Sans']">Welcome back! Here's your venue overview.</p>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-[#F5C518] text-black font-bold border-2 border-black rounded-lg hover:bg-[#F5C518]/80 transition-all shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] hover:shadow-[1px_1px_0px_0px_rgba(10,10,10,1)] hover:translate-x-[1px] hover:translate-y-[1px] font-['Plus_Jakarta_Sans']"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnalyticsFilters
          onDateRangeChange={setDateRange}
          onExperienceChange={setSelectedExperience}
        />

        {/* Revenue Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Revenue"
            value={formatCurrency(analytics.totalRevenue)}
          />
          <MetricCard
            label="Revenue (MTD)"
            value={formatCurrency(analytics.monthlyRevenue)}
          />
          <MetricCard
            label="Revenue (YTD)"
            value={formatCurrency(analytics.yearlyRevenue)}
          />
          <MetricCard
            label="Total Bookings"
            value={analytics.totalBookings.toString()}
          />
        </div>

        {/* Booking Metrics */}
        <div className="grid gap-6 md:grid-cols-3">
          <MetricCard
            label="Confirmed Bookings"
            value={analytics.confirmedBookings.toString()}
          />
          <MetricCard
            label="Pending Bookings"
            value={analytics.pendingBookings.toString()}
          />
          <MetricCard
            label="Completed Bookings"
            value={analytics.completedBookings.toString()}
          />
        </div>

        {/* Average Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          <MetricCard
            label="Avg Booking Value"
            value={formatCurrency(analytics.averageBookingValue)}
          />
          <MetricCard
            label="Avg Student Count"
            value={analytics.averageStudentCount.toFixed(1)}
          />
        </div>

        {/* Revenue Trend Chart */}
        <RevenueTrendChart />

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Bookings */}
          <UpcomingBookings />

          {/* Top Performing Experiences */}
          <Card className="border-2 border-black shadow-[4px_4px_0px_#0A0A0A]">
            <CardHeader>
              <CardTitle>Top Performing Experiences</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topExperiences.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No experiences data available</p>
              ) : (
                <div className="space-y-4">
                  {analytics.topExperiences.map((exp) => (
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
      </div>
    </Layout>
  )
}
