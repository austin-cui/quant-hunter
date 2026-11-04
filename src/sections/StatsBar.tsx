import { siteConfig } from '@/config/site'

export default function StatsBar() {
  if (!siteConfig.stats.length) return null
  return (
    <section className="border-y border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border/60 sm:grid-cols-4">
        {siteConfig.stats.map((s) => (
          <div key={s.label} className="px-4 py-8 text-center">
            <div className="font-display text-3xl font-bold text-gold-gradient sm:text-4xl">
              {s.value}
            </div>
            <div className="mt-2 text-xs text-muted-foreground sm:text-sm">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
