import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { Menu, X, BriefcaseBusiness } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { getAllJobs } from '@/content/jobs'
import { Button } from '@/components/ui/button'
import AdminNavLink from '@/components/site/AdminNavLink'
import ThemeToggle from '@/components/site/ThemeToggle'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/jobs', label: '在招岗位' },
  { to: '/#cases', label: '成功案例' },
  { to: '/#faq', label: '常见问题' },
  { to: '/#contact', label: '联系我' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const jobCount = getAllJobs().length

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* 品牌 */}
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BriefcaseBusiness className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="font-display block text-base font-bold tracking-wide">
              {siteConfig.brand}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {siteConfig.brandZh} · {siteConfig.consultant.name}
            </span>
          </span>
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) =>
            item.to.startsWith('/#') ? (
              <button
                key={item.to}
                onClick={() => {
                  if (location.pathname !== '/') {
                    navigate('/')
                    setTimeout(() => {
                      document
                        .getElementById(item.to.slice(2))
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }, 80)
                  } else {
                    document
                      .getElementById(item.to.slice(2))
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </button>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
          <AdminNavLink />
          <ThemeToggle />
          <Button asChild size="sm" className="ml-3 font-semibold">
            <Link to="/jobs">
              在招岗位
              <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 text-xs">
                {jobCount}
              </span>
            </Link>
          </Button>
        </nav>

        {/* 移动端开关 */}
        <button
          className="rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="打开菜单"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* 移动端菜单 */}
      {open && (
        <nav className="border-t border-border/60 px-4 py-3 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to.startsWith('/#') ? '/' : item.to}
              onClick={() => {
                setOpen(false)
                if (item.to.startsWith('/#')) {
                  setTimeout(() => {
                    document
                      .getElementById(item.to.slice(2))
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }, 80)
                }
              }}
              className="block rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </NavLink>
          ))}
          <AdminNavLink mobile onClick={() => setOpen(false)} />
          <div className="flex items-center gap-1 px-3 py-1.5">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">白天 / 夜间模式</span>
          </div>
        </nav>
      )}
    </header>
  )
}
