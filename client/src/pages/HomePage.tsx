import Hero from '../components/Hero'
// import Tournaments from '../components/Tournaments'
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
          description="International Ritmika Cup - Sezonun en büyük ritmik cimnastik buluşması. Profesyonel fotoğraf ve video hizmetleri ile performansınızı ölümsüzleştirin."
          url="https://ritmikacup.com"
        />
        <Hero />
        {/* <Tournaments /> */}
        <DiscountBanner />
        <Packages />
        <Gallery />
        <HowItWorks />
        <FAQ />
    </div>
  )
}

export default HomePage