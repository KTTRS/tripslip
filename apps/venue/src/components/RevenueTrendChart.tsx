import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui'
import { useRevenueTrend } from '../hooks/useRevenueTrend'

export function RevenueTrendChart() {
  const { trendData, loading, error } = useRevenueTrend()

  if (loading) {
    return (
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Revenue Trend (12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">Loading chart...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Revenue Trend (12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-red-600">Error loading chart: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (trendData.length === 0) {
    return (
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Revenue Trend (12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-black shadow-offset">
      <CardHeader>
        <CardTitle>Revenue Trend (12 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: 'Bookings', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              formatter={(value: number | undefined, name: string | undefined) => {
                if (!value) return ['0', name || 'Unknown']
                if (name === 'revenue') {
                  return [`$${value.toFixed(2)}`, 'Revenue']
                }
                return [value, 'Bookings']
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="revenue" 
              stroke="#F5C518" 
              strokeWidth={2}
              name="Revenue ($)"
              dot={{ r: 4 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="bookings" 
              stroke="#0A0A0A" 
              strokeWidth={2}
              name="Bookings"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
