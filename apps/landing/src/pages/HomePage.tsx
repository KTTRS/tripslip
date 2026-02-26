import Header from '../components/Header'
import Hero from '../components/Hero'
import FeatureGrid from '../components/FeatureGrid'
import Testimonials from '../components/Testimonials'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <FeatureGrid />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  )
}
