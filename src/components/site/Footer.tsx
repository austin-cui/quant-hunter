import { Link } from 'react-router'
import { Mail, Linkedin, Github, MapPin, X } from 'lucide-react'
import { useState } from 'react'
import { siteConfig } from '@/config/site'

/** 社交平台图标（lucide 无对应品牌图标，用彩色字符块保持一排协调） */
function SocialGlyph({ char, bg }: { char: string; bg: string }) {
  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
      style={{ backgroundColor: bg }}
    >
      {char}
    </span>
  )
}

export default function Footer() {
  const { contact, socials, qrcodes, brand, brandZh } = siteConfig
  const [qr, setQr] = useState<null | { label: string; src: string }>(null)

  const qrBase = import.meta.env.BASE_URL

  const channels = [
    {
      key: 'email',
      icon: (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Mail className="h-4 w-4" />
        </span>
      ),
      label: '邮箱',
      sub: contact.email,
      href: `mailto:${contact.email}`,
    },
    {
      key: 'wechat',
      icon: <SocialGlyph char="微" bg="#07c160" />,
      label: '微信',
      sub: '扫码添加',
      onClick: () => setQr({ label: '微信', src: qrBase + qrcodes.wechat }),
    },
    {
      key: 'linkedin',
      icon: (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0a66c2] text-white">
          <Linkedin className="h-4 w-4" />
        </span>
      ),
      label: '领英',
      sub: 'LinkedIn 主页',
      href: socials.linkedin.url,
    },
    {
      key: 'github',
      icon: (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
          <Github className="h-4 w-4" />
        </span>
      ),
      label: 'GitHub',
      sub: 'github.com/austin-cui',
      href: socials.github.url,
    },
    {
      key: 'xiaohongshu',
      icon: <SocialGlyph char="红" bg="#ff2442" />,
      label: '小红书',
      sub: socials.xiaohongshu.id ? `ID: ${socials.xiaohongshu.id}` : '主页',
      href: socials.xiaohongshu.url,
    },
    {
      key: 'maimai',
      icon: <SocialGlyph char="脉" bg="#2f6bff" />,
      label: '脉脉',
      sub: socials.maimai.url ? '脉脉主页' : '扫码添加',
      ...(socials.maimai.url
        ? { href: socials.maimai.url }
        : { onClick: () => setQr({ label: '脉脉', src: qrBase + qrcodes.maimai }) }),
    },
  ].filter((c) => c.href || c.onClick)

  return (
    <footer id="contact" className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* ===== 个人名片 ===== */}
          <div className="card-glow rounded-xl border border-border bg-card p-7 lg:col-span-2">
            <div className="flex items-center gap-4">
              <span className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
                {siteConfig.consultant.avatarText}
              </span>
              <div>
                <div className="font-display text-xl font-bold">
                  {siteConfig.consultant.name}
                </div>
                <div className="mt-0.5 text-sm text-primary">
                  {siteConfig.consultant.title}
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {siteConfig.consultant.intro.split('\n').map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {siteConfig.locations.map((loc) => (
                <span
                  key={loc}
                  className="rounded-full border border-border px-2.5 py-1"
                >
                  {loc}
                </span>
              ))}
            </div>
          </div>

          {/* ===== 联系方式 ===== */}
          <div className="rounded-xl border border-border bg-card p-7 lg:col-span-3">
            <div className="text-sm font-semibold">联系方式</div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              点击图标直接联系；微信 / 脉脉扫码添加
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
              {channels.map((c) => {
                const inner = (
                  <>
                    {c.icon}
                    <div className="mt-2.5 text-sm font-semibold">{c.label}</div>
                    <div className="mt-0.5 max-w-full truncate text-xs text-muted-foreground">
                      {c.sub}
                    </div>
                  </>
                )
                const cls =
                  'group flex flex-col items-center rounded-lg border border-border px-3 py-4 text-center transition-colors hover:border-primary/50 hover:bg-primary/5'
                return c.href ? (
                  <a
                    key={c.key}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    className={cls}
                  >
                    {inner}
                  </a>
                ) : (
                  <button key={c.key} onClick={c.onClick} className={cls}>
                    {inner}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} {brand} · {brandZh} · {siteConfig.consultant.name}
          </span>
          <span>岗位信息以最终沟通为准 · 机构名称经沟通后披露</span>
          <Link to="/jobs" className="transition-colors hover:text-primary">
            浏览全部在招岗位 →
          </Link>
        </div>
      </div>

      {/* ===== 二维码弹窗（微信 / 脉脉） ===== */}
      {qr && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setQr(null)}
        >
          <div
            className="relative rounded-xl border border-border bg-card p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQr(null)}
              aria-label="关闭"
              className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={qr.src}
              alt={`${qr.label}二维码`}
              className="mx-auto w-52 rounded-lg border border-border bg-white p-2"
            />
            <div className="mt-4 text-sm font-semibold">扫码添加{qr.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              添加时请备注「Quant Hunter 官网」
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
