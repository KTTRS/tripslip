import { useState } from 'react'
import { Card, CardContent } from '@tripslip/ui'
import type { PaymentFilters } from '../hooks/useVenuePayments'

interface PaymentFiltersProps {
  onFilterChange: (filters: PaymentFilters) => void
}

export function PaymentFilters({ onFilterChange }: PaymentFiltersProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('')

  const handleApplyFilters = () => {
    const filters: PaymentFilters = {}
    
    if (startDate) {
      filters.startDate = new Date(startDate)
    }
    if (endDate) {
      filters.endDate = new Date(endDate)
    }
    if (status) {
      filters.status = status
    }
    
    onFilterChange(filters)
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setStatus('')
    onFilterChange({})
  }

  return (
    <Card className="border-2 border-black shadow-offset">
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Statuses</option>
              <option value="succeeded">Paid</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 px-4 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="flex-1 px-4 py-2 border-2 border-black font-semibold rounded hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
