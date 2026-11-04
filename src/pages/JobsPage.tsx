import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { getAllJobs, getFunctions } from '@/content/jobs'
import JobCard from '@/components/site/JobCard'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function JobsPage() {
  const jobs = useMemo(() => getAllJobs(), [])
  const functions = useMemo(() => getFunctions(), [])
  const [activeFn, setActiveFn] = useState<string>('全部')
  const [keyword, setKeyword] = useState('')

  const filtered = jobs.filter((j) => {
    const fnOk = activeFn === '全部' || j.function === activeFn
    const kw = keyword.trim().toLowerCase()
    const kwOk =
      !kw ||
      [j.title, j.location, j.companyLabel, j.summary, j.function]
        .join(' ')
        .toLowerCase()
        .includes(kw)
    return fnOk && kwOk
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      {/* 页头 */}
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">在招岗位</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          机构名称以「类型 + 地区」标签保密展示，真实机构在第一通电话中确认。
        </p>
      </div>

      {/* 筛选工具栏 */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['全部', ...functions].map((fn) => (
            <button
              key={fn}
              onClick={() => setActiveFn(fn)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                activeFn === fn
                  ? 'border-primary bg-primary/10 font-semibold text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {fn}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
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
      <div className="mb-5 text-sm text-muted-foreground">
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

      {/* 岗位网格 */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
