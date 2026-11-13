import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { getAllJobs } from '@/content/jobs'
import JobCard from '@/components/site/JobCard'
import SectionHeading from '@/components/site/SectionHeading'

export default function FeaturedJobs() {
  const jobs = getAllJobs()

  return (
    <section className="border-t border-border/60 bg-card/20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          title="最新在招岗位"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.slug} job={job} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:underline"
          >
            查看全部岗位
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
