import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui'
import type { PayoutData, StripeBalance } from '../hooks/useStripePayouts'

interface StripePayoutsProps {
  payouts: PayoutData[]
  balance: StripeBalance | null
  loading: boolean
}

export function StripePayouts({ payouts, balance, loading }: StripePayoutsProps) {
  if (loading) {
    return (
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Stripe Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-black shadow-offset">
      <CardHeader>
        <CardTitle>Stripe Payouts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Balance Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border-2 border-black rounded">
              <div className="text-sm font-semibold text-gray-600 mb-1">Available Balance</div>
              <div className="text-2xl font-bold">
                ${((balance?.available || 0) / 100).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Ready for payout</div>
            </div>
            <div className="p-4 border-2 border-black rounded">
              <div className="text-sm font-semibold text-gray-600 mb-1">Pending Balance</div>
              <div className="text-2xl font-bold">
                ${((balance?.pending || 0) / 100).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Processing payments</div>
            </div>
          </div>

          {/* Payout Schedule */}
          {payouts.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No payouts scheduled or completed yet
            </div>
          ) : (
            <div>
              <h4 className="font-semibold mb-4">Payout Schedule</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left py-3 px-4">Arrival Date</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">
                          {new Date(payout.arrival_date * 1000).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          ${(payout.amount / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <PayoutStatusBadge status={payout.status} />
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {payout.description || 'Payout'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PayoutStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    paid: {
      label: 'Paid',
      className: 'bg-green-100 text-green-700'
    },
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700'
    },
    in_transit: {
      label: 'In Transit',
      className: 'bg-blue-100 text-blue-700'
    },
    canceled: {
      label: 'Canceled',
      className: 'bg-gray-100 text-gray-700'
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-100 text-red-700'
    }
  }

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}
