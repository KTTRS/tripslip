import { useState } from 'react'
import { Layout } from '../components/Layout'
import { MetricCard } from '@tripslip/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tripslip/ui/components/tabs'
import { useVenuePayments } from '../hooks/useVenuePayments'
import { useVenueRefunds } from '../hooks/useVenueRefunds'
import { useStripePayouts } from '../hooks/useStripePayouts'
import { useStripePaymentSync } from '../hooks/useStripePaymentSync'
import { PaymentList } from '../components/PaymentList'
import { PaymentFilters } from '../components/PaymentFilters'
import { RefundHistory } from '../components/RefundHistory'
import { StripePayouts } from '../components/StripePayouts'
import { StripeConnectSetup } from '../components/StripeConnectSetup'
import { exportPaymentsToCSV, exportRefundsToCSV } from '../utils/csvExport'
import type { PaymentFilters as PaymentFiltersType } from '../hooks/useVenuePayments'

export default function FinancialsPage() {
  const [filters, setFilters] = useState<PaymentFiltersType>({})
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'refunds' | 'payouts' | 'setup'>('overview')
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
            <h2 className="text-3xl font-bold font-['Fraunces']">Financials</h2>
            <p className="text-gray-600 mt-2 font-['Plus_Jakarta_Sans']">
              Track revenue, payments, and manage your Stripe integration
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSyncPayments}
              disabled={syncing}
              className="px-4 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black font-['Plus_Jakarta_Sans']"
            >
              {syncing ? 'Syncing...' : 'Sync with Stripe'}
            </button>
            <button
              onClick={handleExportPayments}
              disabled={loading || payments.length === 0}
              className="px-4 py-2 border-2 border-black font-semibold rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-['Plus_Jakarta_Sans']"
            >
              Export Payments
            </button>
            <button
              onClick={handleExportRefunds}
              disabled={refundsLoading || refunds.length === 0}
              className="px-4 py-2 border-2 border-black font-semibold rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-['Plus_Jakarta_Sans']"
            >
              Export Refunds
            </button>
          </div>
        </div>

        {/* Financial Overview */}
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
          <TabsList className="border-2 border-black">
            <TabsTrigger value="overview" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Overview
            </TabsTrigger>
            <TabsTrigger value="payments" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Payment History
            </TabsTrigger>
            <TabsTrigger value="refunds" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Refund History
            </TabsTrigger>
            <TabsTrigger value="payouts" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Stripe Payouts
            </TabsTrigger>
            <TabsTrigger value="setup" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Stripe Setup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Stripe Balance */}
              <div className="p-6 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-white">
                <h3 className="text-lg font-bold mb-4 font-['Fraunces']">Stripe Balance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-['Plus_Jakarta_Sans']">Available Balance</span>
                    <span className="text-xl font-bold font-['Space_Mono']">
                      ${((balance?.available || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-['Plus_Jakarta_Sans']">Pending Balance</span>
                    <span className="text-lg font-semibold font-['Space_Mono']">
                      ${((balance?.pending || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-6 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-white">
                <h3 className="text-lg font-bold mb-4 font-['Fraunces']">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                    Last 30 days activity summary
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-['Plus_Jakarta_Sans']">New Payments</span>
                    <span className="font-semibold font-['Space_Mono']">
                      {payments.filter(p => {
                        const paymentDate = new Date(p.created_at);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return paymentDate >= thirtyDaysAgo;
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-['Plus_Jakarta_Sans']">New Refunds</span>
                    <span className="font-semibold font-['Space_Mono']">
                      {refunds.filter(r => {
                        const refundDate = new Date(r.created_at);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return refundDate >= thirtyDaysAgo;
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            {activeTab === 'payments' && <PaymentFilters onFilterChange={setFilters} />}
            <PaymentList payments={payments} loading={loading} />
          </TabsContent>

          <TabsContent value="refunds">
            <RefundHistory refunds={refunds} loading={refundsLoading} />
          </TabsContent>

          <TabsContent value="payouts">
            <StripePayouts payouts={payouts} balance={balance} loading={payoutsLoading} />
          </TabsContent>

          <TabsContent value="setup">
            <StripeConnectSetup />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}