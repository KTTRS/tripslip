import { useState } from 'react'
import Layout from '../components/Layout'
import { MetricCard } from '@tripslip/ui'
import { useVenuePayments } from '../hooks/useVenuePayments'
import { useVenueRefunds } from '../hooks/useVenueRefunds'
import { useStripePayouts } from '../hooks/useStripePayouts'
import { useStripePaymentSync } from '../hooks/useStripePaymentSync'
import { PaymentList } from '../components/PaymentList'
import { PaymentFilters } from '../components/PaymentFilters'
import { RefundHistory } from '../components/RefundHistory'
import { StripePayouts } from '../components/StripePayouts'
import { exportPaymentsToCSV, exportRefundsToCSV } from '../utils/csvExport'
import type { PaymentFilters as PaymentFiltersType } from '../hooks/useVenuePayments'

export default function FinancialsPage() {
  const [filters, setFilters] = useState<PaymentFiltersType>({})
  const [activeTab, setActiveTab] = useState<'payments' | 'refunds' | 'payouts'>('payments')
  const { payments, summary, loading, refetch: refetchPayments } = useVenuePayments(filters)
  const { refunds, loading: refundsLoading } = useVenueRefunds()
  const { payouts, balance, loading: payoutsLoading } = useStripePayouts()
  const { syncAllPayments, syncing } = useStripePaymentSync()

  const handleExportPayments = () => {
    const dateRange = filters.startDate && filters.endDate 
      ? { start: filters.startDate, end: filters.endDate }
      : undefined
    exportPaymentsToCSV(payments, dateRange)
  }

  const handleExportRefunds = () => {
    exportRefundsToCSV(refunds)
  }

  const handleSyncPayments = async () => {
    try {
      await syncAllPayments()
      await refetchPayments()
    } catch (err) {
      console.error('Failed to sync payments:', err)
    }
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold">Financials</h2>
            <p className="text-gray-600 mt-2">Track revenue and payments</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSyncPayments}
              disabled={syncing}
              className="px-4 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? 'Syncing...' : 'Sync with Stripe'}
            </button>
            <button
              onClick={handleExportPayments}
              disabled={loading || payments.length === 0}
              className="px-4 py-2 border-2 border-black font-semibold rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Payments
            </button>
            <button
              onClick={handleExportRefunds}
              disabled={refundsLoading || refunds.length === 0}
              className="px-4 py-2 border-2 border-black font-semibold rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Refunds
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <MetricCard
            label="Total Revenue"
            value={loading ? '...' : `$${((summary?.totalRevenue || 0) / 100).toFixed(2)}`}
            sub={`${summary?.successfulPayments || 0} successful payments`}
          />
          <MetricCard
            label="Pending Payments"
            value={loading ? '...' : `$${((summary?.pendingPayments || 0) / 100).toFixed(2)}`}
            sub={`${summary?.pendingCount || 0} pending`}
          />
          <MetricCard
            label="Refunds Issued"
            value={loading ? '...' : `$${((summary?.refundedAmount || 0) / 100).toFixed(2)}`}
            sub={`${summary?.refundedCount || 0} refunds`}
          />
        </div>

        {activeTab === 'payments' && <PaymentFilters onFilterChange={setFilters} />}

        <div className="flex gap-4 border-b-2 border-black">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'payments'
                ? 'border-b-4 border-black -mb-0.5'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Payment History
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'refunds'
                ? 'border-b-4 border-black -mb-0.5'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Refund History
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'payouts'
                ? 'border-b-4 border-black -mb-0.5'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Stripe Payouts
          </button>
        </div>

        {activeTab === 'payments' && <PaymentList payments={payments} loading={loading} />}
        {activeTab === 'refunds' && <RefundHistory refunds={refunds} loading={refundsLoading} />}
        {activeTab === 'payouts' && <StripePayouts payouts={payouts} balance={balance} loading={payoutsLoading} />}
      </div>
    </Layout>
  )
}
