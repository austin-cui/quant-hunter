import { Link } from 'react-router'
import { MapPin, ChevronRight } from 'lucide-react'
import type { Job } from '@/types/job'
import { Badge } from '@/components/ui/badge'

export default function JobCard({ job }: { job: Job }) {
  return (
    <Link
      to={`/jobs/${job.slug}`}
      className="card-glow group relative flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-5"
    >
      <div className="min-w-0">
        <h3 className="font-display truncate text-lg font-bold leading-snug transition-colors group-hover:text-primary">
          {job.title}
        </h3>
        <Badge variant="secondary" className="mt-2 gap-1 font-normal">
          <MapPin className="h-3 w-3" />
          {job.location}
        </Badge>
      </div>
      <span className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        查看 JD
        <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  )
}
