import type { VenueAnalytics } from '../hooks/useVenueAnalytics'
import type { PaymentData } from '../hooks/useVenuePayments'
import type { RefundData } from '../hooks/useVenueRefunds'

export function exportAnalyticsToCSV(analytics: VenueAnalytics, dateRange?: { start: Date; end: Date }) {
  // Prepare CSV data
  const rows: string[][] = []

  // Add header
  rows.push(['TripSlip Venue Analytics Report'])
  rows.push([])

  // Add date range if provided
  if (dateRange) {
    rows.push(['Date Range:', `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`])
  } else {
    rows.push(['Date Range:', 'All Time'])
  }
  rows.push(['Generated:', new Date().toLocaleString()])
  rows.push([])

  // Revenue Summary
  rows.push(['Revenue Summary'])
  rows.push(['Metric', 'Value'])
  rows.push(['Total Revenue', `$${(analytics.totalRevenue / 100).toFixed(2)}`])
  rows.push(['Monthly Revenue', `$${(analytics.monthlyRevenue / 100).toFixed(2)}`])
  rows.push(['Yearly Revenue', `$${(analytics.yearlyRevenue / 100).toFixed(2)}`])
  rows.push([])

  // Booking Summary
  rows.push(['Booking Summary'])
  rows.push(['Metric', 'Count'])
  rows.push(['Total Bookings', analytics.totalBookings.toString()])
  rows.push(['Confirmed Bookings', analytics.confirmedBookings.toString()])
  rows.push(['Pending Bookings', analytics.pendingBookings.toString()])
  rows.push(['Completed Bookings', analytics.completedBookings.toString()])
  rows.push([])

  // Average Metrics
  rows.push(['Average Metrics'])
  rows.push(['Metric', 'Value'])
  rows.push(['Average Booking Value', `$${(analytics.averageBookingValue / 100).toFixed(2)}`])
  rows.push(['Average Student Count', analytics.averageStudentCount.toFixed(1)])
  rows.push([])

  // Top Performing Experiences
  rows.push(['Top Performing Experiences'])
  rows.push(['Experience', 'Bookings', 'Revenue'])
  analytics.topExperiences.forEach(exp => {
    rows.push([
      exp.title,
      exp.bookingCount.toString(),
      `$${(exp.revenue / 100).toFixed(2)}`
    ])
  })

  // Convert to CSV string
  const csvContent = rows
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `venue-analytics-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportRevenueTrendToCSV(trendData: Array<{ month: string; revenue: number; bookings: number }>) {
  // Prepare CSV data
  const rows: string[][] = []

  // Add header
  rows.push(['TripSlip Revenue Trend Report'])
  rows.push(['Generated:', new Date().toLocaleString()])
  rows.push([])

  // Add data
  rows.push(['Month', 'Revenue', 'Bookings'])
  trendData.forEach(data => {
    rows.push([
      data.month,
      `$${data.revenue.toFixed(2)}`,
      data.bookings.toString()
    ])
  })

  // Convert to CSV string
  const csvContent = rows
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `revenue-trend-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportPaymentsToCSV(payments: PaymentData[], dateRange?: { start: Date; end: Date }) {
  // Prepare CSV data
  const rows: string[][] = []

  // Add header
  rows.push(['TripSlip Payment Report'])
  rows.push([])

  // Add date range if provided
  if (dateRange) {
    rows.push(['Date Range:', `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`])
  } else {
    rows.push(['Date Range:', 'All Time'])
  }
  rows.push(['Generated:', new Date().toLocaleString()])
  rows.push([])

  // Add payment data
  rows.push(['Date', 'Trip', 'School', 'Student', 'Amount', 'Payment Method', 'Transaction ID', 'Status'])
  
  payments.forEach(payment => {
    rows.push([
      new Date(payment.paid_at || payment.created_at).toLocaleDateString(),
      payment.trip.trip_name,
      payment.trip.school?.name || 'N/A',
      `${payment.permission_slip.student.first_name} ${payment.permission_slip.student.last_name}`,
      `${(payment.amount_cents / 100).toFixed(2)}`,
      payment.payment_method || 'N/A',
      payment.stripe_payment_intent_id || 'N/A',
      payment.status
    ])
  })

  // Add summary
  rows.push([])
  rows.push(['Summary'])
  const totalRevenue = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount_cents, 0)
  const pendingAmount = payments
    .filter(p => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount_cents, 0)
  
  rows.push(['Total Revenue:', `${(totalRevenue / 100).toFixed(2)}`])
  rows.push(['Pending Payments:', `${(pendingAmount / 100).toFixed(2)}`])
  rows.push(['Total Transactions:', payments.length.toString()])

  // Convert to CSV string
  const csvContent = rows
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `payment-report-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportRefundsToCSV(refunds: RefundData[]) {
  // Prepare CSV data
  const rows: string[][] = []

  // Add header
  rows.push(['TripSlip Refund Report'])
  rows.push(['Generated:', new Date().toLocaleString()])
  rows.push([])

  // Add refund data
  rows.push(['Date', 'Trip', 'Student', 'Amount', 'Reason', 'Refund ID', 'Status'])
  
  refunds.forEach(refund => {
    rows.push([
      new Date(refund.processed_at || refund.created_at).toLocaleDateString(),
      refund.payment.trip.trip_name,
      `${refund.payment.permission_slip.student.first_name} ${refund.payment.permission_slip.student.last_name}`,
      `${(refund.amount_cents / 100).toFixed(2)}`,
      refund.reason || 'No reason provided',
      refund.stripe_refund_id || 'N/A',
      refund.status
    ])
  })

  // Add summary
  rows.push([])
  rows.push(['Summary'])
  const totalRefunded = refunds
    .filter(r => r.status === 'succeeded')
    .reduce((sum, r) => sum + r.amount_cents, 0)
  
  rows.push(['Total Refunded:', `${(totalRefunded / 100).toFixed(2)}`])
  rows.push(['Total Refunds:', refunds.length.toString()])

  // Convert to CSV string
  const csvContent = rows
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `refund-report-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
