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
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading analytics...</p>
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-gray-600 mt-2">Welcome back! Here's your venue overview.</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-primary text-white font-bold border-2 border-black rounded hover:bg-primary/90 transition-colors"
          >
            Export CSV
          </button>
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
          <Card className="border-2 border-black shadow-offset">
            <CardHeader>
              <CardTitle>Top Performing Experiences</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topExperiences.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No experiences data available</p>
              ) : (
                <div className="space-y-4">
                  {analytics.topExperiences.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
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
