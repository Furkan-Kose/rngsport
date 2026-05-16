import Hero from '../components/Hero'
import Tournaments from '../components/Tournaments'
import DiscountBanner from '../components/DiscountBanner'
import Packages from '../components/Packages'
import Gallery from '../components/Gallery'
import HowItWorks from '../components/Process'
import FAQ from '../components/FAQ'
import SEO from '../components/SEO'

const HomePage = () => {
  return (
    <div>
        <SEO
          title="Ana Sayfa"
          description="RNG Sport - Ritmik cimnastik başta olmak üzere spor yarışma ve turnuvaları için profesyonel fotoğraf, video ve dijital içerik üretimi sunan spor medya ajansı."
          url="https://rngsport.com"
        />
        <Hero />
        <Tournaments />
        <DiscountBanner />
        <Packages />
        <Gallery />
        <HowItWorks />
        <FAQ />
    </div>
  )
}

export default HomePage