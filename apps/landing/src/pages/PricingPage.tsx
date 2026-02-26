import Header from '../components/Header'
import PricingTable from '../components/PricingTable'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <PricingTable />
      <CTASection />
      <Footer />
    </div>
  )
}
