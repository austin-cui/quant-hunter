import Hero from '@/sections/Hero'
import StatsBar from '@/sections/StatsBar'
import FeaturedJobs from '@/sections/FeaturedJobs'
import Faq from '@/sections/Faq'
import RegisterCta from '@/sections/RegisterCta'

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <FeaturedJobs />
      <Faq />
      <RegisterCta />
    </>
  )
}
