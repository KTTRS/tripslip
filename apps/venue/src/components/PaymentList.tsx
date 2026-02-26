import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui'
import type { PaymentData } from '../hooks/useVenuePayments'

interface PaymentListProps {
  payments: PaymentData[]
  loading: boolean
}

export function PaymentList({ payments, loading }: PaymentListProps) {
  if (loading) {
    return (
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (payments.length === 0) {
    return (
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">No payments found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-black shadow-offset">
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Trip</th>
                <th className="text-left py-3 px-4">School</th>
                <th className="text-left py-3 px-4">Student</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-left py-3 px-4">Transaction ID</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">
                    {new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 px-4">{payment.trip.trip_name}</td>
                  <td className="py-3 px-4">{payment.trip.school?.name || 'N/A'}</td>
                  <td className="py-3 px-4">
                    {payment.permission_slip.student.first_name} {payment.permission_slip.student.last_name}
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    ${(payment.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    {payment.payment_method || 'N/A'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {payment.stripe_payment_intent_id ? (
                      <span className="truncate block max-w-[150px]" title={payment.stripe_payment_intent_id}>
                        {payment.stripe_payment_intent_id}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={payment.status} />
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
      label: 'Paid',
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
    },
    refunded: {
      label: 'Refunded',
      className: 'bg-purple-100 text-purple-700'
    }
  }

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}
