import { useState } from 'react'
import { Layout } from '../components/Layout'
import { Card, CardHeader, CardTitle, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from '@tripslip/ui'
import { TripBookingList } from '../components/TripBookingList'
import { TripCalendarView } from '../components/TripCalendarView'
import { TripFilters } from '../components/TripFilters'
import { useVenueTrips } from '../hooks/useVenueTrips'
import type { VenueTrip } from '../hooks/useVenueTrips'

export default function TripsPage() {
  const [filters, setFilters] = useState<{
    status?: string
    experienceId?: string
    startDate?: string
    endDate?: string
  }>({})

  const { trips, loading, error, confirmTrip, declineTrip, addNote } = useVenueTrips(filters)

  const handleDateClick = (date: Date, dayTrips: VenueTrip[]) => {
    if (dayTrips.length > 0) {
      alert(`${dayTrips.length} trip(s) on ${date.toLocaleDateString()}`)
    }
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold">Trip Bookings</h2>
          <p className="text-gray-600 mt-2">View and manage incoming trip bookings</p>
        </div>

        {/* Filters */}
        <TripFilters onFilterChange={setFilters} />

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
            <p className="font-semibold">Error loading trips</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading trips...</p>
          </div>
        )}

        {/* Trips Display */}
        {!loading && !error && (
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <Card className="border-2 border-black shadow-offset">
                <CardHeader>
                  <CardTitle>
                    Trip Bookings ({trips.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TripBookingList
                    trips={trips}
                    onConfirm={confirmTrip}
                    onDecline={declineTrip}
                    onAddNote={addNote}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <Card className="border-2 border-black shadow-offset">
                <CardHeader>
                  <CardTitle>Calendar View</CardTitle>
                </CardHeader>
                <CardContent>
                  <TripCalendarView
                    trips={trips}
                    onDateClick={handleDateClick}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  )
}
