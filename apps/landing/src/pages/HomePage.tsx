import Header from '../components/Header'
import Hero from '../components/Hero'
import PhotoShowcase from '../components/PhotoShowcase'
import FeatureGrid from '../components/FeatureGrid'
import HowItWorks from '../components/HowItWorks'
import BrandCharacters from '../components/BrandCharacters'
import Testimonials from '../components/Testimonials'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <PhotoShowcase />
      <HowItWorks />
      <FeatureGrid />
      <BrandCharacters />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  )
}
