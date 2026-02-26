import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui'
import type { RefundData } from '../hooks/useVenueRefunds'

interface RefundHistoryProps {
  refunds: RefundData[]
  loading: boolean
}

export function RefundHistory({ refunds, loading }: RefundHistoryProps) {
  if (loading) {
    return (
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Refund History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (refunds.length === 0) {
    return (
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Refund History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">No refunds found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-black shadow-offset">
      <CardHeader>
        <CardTitle>Refund History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Trip</th>
                <th className="text-left py-3 px-4">Student</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Reason</th>
                <th className="text-left py-3 px-4">Refund ID</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">
                    {new Date(refund.processed_at || refund.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 px-4">{refund.payment.trip.trip_name}</td>
                  <td className="py-3 px-4">
                    {refund.payment.permission_slip.student.first_name}{' '}
                    {refund.payment.permission_slip.student.last_name}
                  </td>
                  <td className="py-3 px-4 font-semibold text-red-600">
                    -${(refund.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    {refund.reason || 'No reason provided'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {refund.stripe_refund_id ? (
                      <span className="truncate block max-w-[150px]" title={refund.stripe_refund_id}>
                        {refund.stripe_refund_id}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={refund.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    succeeded: {
      label: 'Completed',
      className: 'bg-green-100 text-green-700'
    },
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700'
    },
    processing: {
      label: 'Processing',
      className: 'bg-blue-100 text-blue-700'
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-100 text-red-700'
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-700'
    }
  }

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}
