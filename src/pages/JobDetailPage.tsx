import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft, MapPin, MessageCircle, Send, Loader2,
  CheckCircle2, ChevronRight,
} from 'lucide-react'
import { getAllJobs, getJobBySlug } from '@/content/jobs'
import { siteConfig } from '@/config/site'
import { isFormConfigured, submitApplication } from '@/lib/submit'
import ShareButton from '@/components/site/ShareButton'
import JobCard from '@/components/site/JobCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function JobDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const job = slug ? getJobBySlug(slug) : undefined

  // 动态标题：转发到 LinkedIn/微信时链接预览更专业
  useEffect(() => {
    document.title = job
      ? `${job.title} | ${siteConfig.meta.title}`
      : siteConfig.meta.title
    return () => {
      document.title = siteConfig.meta.title
    }
  }, [job])

  if (!job) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <div className="font-display text-6xl font-bold text-primary/30">404</div>
        <p className="mt-4 text-muted-foreground">这个岗位不存在或已下架</p>
        <Button asChild variant="outline" className="mt-8">
          <Link to="/jobs">浏览在招岗位</Link>
        </Button>
      </div>
    )
  }

  const mailSubject = encodeURIComponent(`【应聘】${job.title}`)
  const mailBody = encodeURIComponent(
    [`你好，我对这个岗位感兴趣：`, ``, `岗位：${job.title}`, `链接：${typeof window !== 'undefined' ? window.location.href : ''}`, ``, `（我的简历见附件）`].join('\n'),
  )
  const related = getAllJobs().filter((j) => j.slug !== job.slug).slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* 面包屑 */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-primary">首页</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/jobs" className="transition-colors hover:text-primary">在招岗位</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-foreground">{job.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* ===== 左列：JD 主体 ===== */}
        <article>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight">
                {job.title}
              </h1>
              <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {job.location}
              </div>
            </div>
            <ShareButton />
          </div>

          {/* 职责 JD */}
          <div className="mt-10">
            <h2 className="font-display mb-4 text-xl font-bold">工作职责</h2>
            <ul className="space-y-2.5">
              {job.responsibilities.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 移动端申请区 */}
          <div className="mt-10 lg:hidden">
            <ApplyPanel jobTitle={job.title} mailSubject={mailSubject} mailBody={mailBody} />
          </div>
        </article>

        {/* ===== 右列：悬浮申请面板（桌面端） ===== */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ApplyPanel jobTitle={job.title} mailSubject={mailSubject} mailBody={mailBody} />
          </div>
        </aside>
      </div>

      {/* 更多岗位 */}
      {related.length > 0 && (
        <div className="mt-20">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold">更多在招岗位</h2>
            <Link
              to="/jobs"
              className="flex items-center gap-1 text-sm text-primary transition-colors hover:underline"
            >
              全部岗位
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((j) => (
              <JobCard key={j.slug} job={j} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** 申请面板：附件简历投递 + 微信 + 响应承诺（未配置 formAccessKey 时回退为邮件投递） */
function ApplyPanel({
  jobTitle,
  mailSubject,
  mailBody,
}: {
  jobTitle: string
  mailSubject: string
  mailBody: string
}) {
  const hasForm = isFormConfigured()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [resume, setResume] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const fallback = () => {
    window.location.href = `mailto:${siteConfig.contact.email}?subject=${mailSubject}&body=${mailBody}`
    setStatus('sent')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasForm) return fallback()
    setStatus('sending')
    const res = await submitApplication({
      type: 'apply',
      name,
      email,
      jobTitle,
      resume,
    })
    setStatus(res.ok ? 'sent' : 'error')
  }

  if (status === 'sent') {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
        <div className="mt-3 font-display text-lg font-bold">投递成功</div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {hasForm
            ? '简历已提交，工作日 48 小时内回复，请留意邮箱。'
            : '已为你打开邮件客户端，点击发送即完成投递；工作日 48 小时内回复。'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="font-display text-lg font-bold">申请这个岗位</div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        工作日 48 小时内回复，合适即安排 15 分钟电话沟通。
      </p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="姓名 *"
        />
        <Input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱 *"
        />
        <Input
          type="file"
          required
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResume(e.target.files?.[0] ?? null)}
          className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:text-primary"
        />
        {status === 'error' && (
          <p className="text-xs text-red-500">
            提交未成功，请把简历发送至 {siteConfig.contact.email}
          </p>
        )}
        {hasForm && status !== 'error' && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            在线提交需连接 VPN，也可微信扫码直投。
          </p>
        )}
        <Button type="submit" disabled={status === 'sending'} className="w-full gap-2 font-semibold">
          {status === 'sending' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {hasForm ? '投递简历' : '邮件投递（预填岗位名）'}
        </Button>
      </form>
      <div className="mt-4 rounded-lg border border-border bg-background p-4 text-center">
        <div className="mb-2.5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4 text-primary" />
          微信扫码直投（更快，12h 内首响）
        </div>
        <img
          src={import.meta.env.BASE_URL + siteConfig.qrcodes.wechat}
          alt="微信二维码"
          className="mx-auto w-36 rounded-md border border-border bg-white p-1.5"
        />
      </div>
      <p className="mt-5 border-t border-border/60 pt-4 text-xs leading-relaxed text-muted-foreground">
        {siteConfig.privacyNote}投递「{jobTitle}」时请注明，方便快速匹配。
      </p>
    </div>
  )
}
