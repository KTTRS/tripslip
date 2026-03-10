import { useState } from 'react'
import { Layout } from '../components/Layout'
import { useVenuePayments, type PaymentFilters as PaymentFilterType } from '../hooks/useVenuePayments'
import { useVenueRefunds } from '../hooks/useVenueRefunds'
import { useVenue } from '../contexts/AuthContext'
import { RevenueTrendChart } from '../components/RevenueTrendChart'
import { PaymentList } from '../components/PaymentList'
import { PaymentFilters } from '../components/PaymentFilters'
import { RefundHistory } from '../components/RefundHistory'
import { DollarSign, Clock, RotateCcw, CheckCircle } from 'lucide-react'

export default function FinancialsPage() {
  const { venueId, venueLoading } = useVenue()
  const [filters, setFilters] = useState<PaymentFilterType>({})
  const { payments, summary, loading: paymentsLoading, error: paymentsError } = useVenuePayments(filters)
  const { refunds, loading: refundsLoading, error: refundsError } = useVenueRefunds()
  const [activeTab, setActiveTab] = useState<'payments' | 'refunds'>('payments')

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  if (venueLoading || (paymentsLoading && !summary)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F5C518] border-t-[#0A0A0A]"></div>
          <p className="text-gray-600 font-semibold font-['Plus_Jakarta_Sans']">Loading financials...</p>
        </div>
      </Layout>
    )
  }

  if (!venueId) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center bg-white">
            <div className="text-6xl mb-6">💰</div>
            <h2 className="text-3xl font-bold font-['Fraunces'] text-[#0A0A0A] mb-3">No Venue Linked</h2>
            <p className="text-gray-600 font-['Plus_Jakarta_Sans']">
              Your account isn't linked to a venue yet. Contact support to get set up.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  if (paymentsError) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="border-2 border-red-300 rounded-2xl shadow-[4px_4px_0px_rgba(239,68,68,0.3)] p-8 text-center bg-red-50">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold font-['Fraunces'] text-red-700 mb-3">Error Loading Financials</h2>
            <p className="text-red-600 font-['Plus_Jakarta_Sans']">{paymentsError}</p>
          </div>
        </div>
      </Layout>
    )
  }

  const noPayments = payments.length === 0 && !filters.startDate && !filters.endDate && !filters.status

  return (
    <Layout>
      <div className="space-y-8">
        <div className="relative rounded-2xl border-2 border-black bg-gradient-to-r from-[#F5C518]/10 via-white to-emerald-50 p-6 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
          <div className="flex items-center gap-5">
            <img
              src="/images/icon-payment.png"
              alt=""
              className="w-14 h-14 hidden sm:block object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold font-['Fraunces']">Financials</h1>
              <p className="text-gray-600 mt-1 font-['Plus_Jakarta_Sans']">Track payments, revenue, and refunds for your venue.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
            label="Total Revenue"
            value={formatCurrency(summary?.totalRevenue ?? 0)}
            bgColor="bg-emerald-50"
            borderColor="border-emerald-200"
          />
          <SummaryCard
            icon={<Clock className="h-6 w-6 text-yellow-600" />}
            label="Pending Payments"
            value={formatCurrency(summary?.pendingPayments ?? 0)}
            subtitle={`${summary?.pendingCount ?? 0} pending`}
            bgColor="bg-yellow-50"
            borderColor="border-yellow-200"
          />
          <SummaryCard
            icon={<RotateCcw className="h-6 w-6 text-red-600" />}
            label="Refunded Amount"
            value={formatCurrency(summary?.refundedAmount ?? 0)}
            subtitle={`${summary?.refundedCount ?? 0} refunds`}
            bgColor="bg-red-50"
            borderColor="border-red-200"
          />
          <SummaryCard
            icon={<CheckCircle className="h-6 w-6 text-blue-600" />}
            label="Successful Payments"
            value={String(summary?.successfulPayments ?? 0)}
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
          />
        </div>

        {noPayments ? (
          <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-12 text-center bg-white">
            <img src="/images/icon-payment.png" alt="" className="w-20 h-20 mx-auto mb-4 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
            <h3 className="text-2xl font-bold font-['Fraunces'] text-[#0A0A0A] mb-2">No payments recorded yet</h3>
            <p className="text-gray-600 font-['Plus_Jakarta_Sans'] max-w-md mx-auto">
              When teachers book trips to your venue and parents make payments, they'll appear here.
            </p>
          </div>
        ) : (
          <>
            <RevenueTrendChart />

            <PaymentFilters onFilterChange={setFilters} />

            <div className="flex gap-2 border-b-2 border-[#0A0A0A]">
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-6 py-3 font-bold font-['Plus_Jakarta_Sans'] border-2 border-b-0 border-[#0A0A0A] rounded-t-xl transition-all ${
                  activeTab === 'payments'
                    ? 'bg-[#F5C518] text-[#0A0A0A] shadow-[2px_-2px_0px_#0A0A0A]'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                Payments ({payments.length})
              </button>
              <button
                onClick={() => setActiveTab('refunds')}
                className={`px-6 py-3 font-bold font-['Plus_Jakarta_Sans'] border-2 border-b-0 border-[#0A0A0A] rounded-t-xl transition-all ${
                  activeTab === 'refunds'
                    ? 'bg-[#F5C518] text-[#0A0A0A] shadow-[2px_-2px_0px_#0A0A0A]'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                Refunds ({refunds.length})
              </button>
            </div>

            {activeTab === 'payments' && (
              <PaymentList payments={payments} loading={paymentsLoading} />
            )}

            {activeTab === 'refunds' && (
              <RefundHistory refunds={refunds} loading={refundsLoading} />
            )}

            {refundsError && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-700 font-['Plus_Jakarta_Sans']">
                Error loading refunds: {refundsError}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  subtitle,
  bgColor,
  borderColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle?: string
  bgColor: string
  borderColor: string
}) {
  return (
    <div className={`${bgColor} border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-6`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 ${borderColor} border-2 rounded-xl bg-white`}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-gray-600 font-['Plus_Jakarta_Sans']">{label}</span>
      </div>
      <p className="text-2xl font-bold font-['Fraunces'] text-[#0A0A0A]">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1 font-['Plus_Jakarta_Sans']">{subtitle}</p>
      )}
    </div>
  )
}
