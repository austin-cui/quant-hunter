import Hero from '@/sections/Hero'
import StatsBar from '@/sections/StatsBar'
import FeaturedJobs from '@/sections/FeaturedJobs'
import Cases from '@/sections/Cases'
import Faq from '@/sections/Faq'
import RegisterCta from '@/sections/RegisterCta'

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <FeaturedJobs />
      <Cases />
      <Faq />
      <RegisterCta />
    </>
  )
}
