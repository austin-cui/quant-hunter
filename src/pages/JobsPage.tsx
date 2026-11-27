import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { getAllJobs } from '@/content/jobs'
import JobCard from '@/components/site/JobCard'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function JobsPage() {
  const jobs = useMemo(() => getAllJobs(), [])
  const [keyword, setKeyword] = useState('')

  const filtered = jobs.filter((j) => {
    const kw = keyword.trim().toLowerCase()
    return (
      !kw ||
      [j.title, j.location, ...j.responsibilities]
        .join(' ')
        .toLowerCase()
        .includes(kw)
    )
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      {/* 页头 */}
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">在招岗位</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          只放岗位名称、地点与职责 JD；薪资与机构细节以电话沟通为准。
        </p>
      </div>

      {/* 搜索 */}
      <div className="mb-8 flex justify-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索岗位 / 城市 / 关键词"
            className="pl-9"
          />
        </div>
      </div>

      {/* 结果统计 */}
      <div className="mb-5 text-center text-sm text-muted-foreground">
        共 <span className="font-semibold text-primary">{filtered.length}</span>{' '}
        个岗位
        {keyword && (
          <>
            {' '}
            · 关键词「{keyword}」
            <button
              className="ml-2 underline underline-offset-2 hover:text-primary"
              onClick={() => setKeyword('')}
            >
              清除
            </button>
          </>
        )}
      </div>

      {/* 岗位列表 */}
      {filtered.length > 0 ? (
        <div className="mx-auto grid max-w-3xl gap-4">
          {filtered.map((job) => (
            <JobCard key={job.slug} job={job} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-muted-foreground">没有匹配的岗位</p>
          <p className="mt-2 text-sm text-muted-foreground">
            试试其它关键词，或者到首页底部登记简历，有新岗位我会主动找你。
          </p>
        </div>
      )}

      {/* 页脚提示 */}
      <div className="mt-14 rounded-xl border border-border bg-card/60 p-6 text-center">
        <Badge variant="secondary" className="mb-3 font-normal">
          隐私承诺
        </Badge>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
          你的简历未经你书面同意不会提供给任何机构；每次推荐前都会先与你确认机构类型与岗位要求。
          每个候选人同一机构只通过一位猎头推荐，不会冲突。
        </p>
      </div>
    </div>
  )
}
