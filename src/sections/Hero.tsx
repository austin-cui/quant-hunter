import { Link } from 'react-router'
import { ArrowRight, Mail, MessageCircle } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { getAllJobs } from '@/content/jobs'
import { Button } from '@/components/ui/button'

export default function Hero() {
  const c = siteConfig.consultant
  const jobCount = getAllJobs().length

  return (
    <section className="relative overflow-hidden">
      {/* 背景装饰网格 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(40 62% 55%) 1px, transparent 1px), linear-gradient(90deg, hsl(40 62% 55%) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          {/* 头像 + 身份 */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-2xl font-bold tracking-widest text-primary shadow-[0_0_60px_-10px_hsl(40_62%_55%/0.5)]">
              {c.avatarText}
            </div>
          </div>

          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            {c.title}
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            {c.name}
            <span className="mx-3 text-muted-foreground">·</span>
            <span className="text-gold-gradient">{siteConfig.brand}</span>
          </h1>

          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-muted-foreground sm:text-lg">
            {c.intro}
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full gap-2 font-semibold sm:w-auto">
              <Link to="/jobs">
                查看在招岗位
                <span className="rounded-full bg-primary-foreground/20 px-2 text-sm">
                  {jobCount}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
              <a href="#register" onClick={(e) => {
                e.preventDefault()
                document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                <Mail className="h-4 w-4" />
                投递简历
              </a>
            </Button>
            <Button asChild size="lg" variant="ghost" className="w-full gap-2 sm:w-auto">
              <a href="#contact" onClick={(e) => {
                e.preventDefault()
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                <MessageCircle className="h-4 w-4" />
                微信联系
              </a>
            </Button>
          </div>

          {/* 覆盖地区 */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="mr-1">覆盖地区：</span>
            {siteConfig.locations.map((loc) => (
              <span
                key={loc}
                className="rounded-full border border-border px-3 py-1"
              >
                {loc}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
