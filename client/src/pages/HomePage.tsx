import Hero from '../components/Hero'
// import Tournaments from '../components/Tournaments'
import DiscountBanner from '../components/DiscountBanner'
import Packages from '../components/Packages'
import Gallery from '../components/Gallery'
import HowItWorks from '../components/Process'
import FAQ from '../components/FAQ'

const HomePage = () => {
  return (
    <div>
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