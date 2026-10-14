import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { siteConfig } from '@/config/site'

/**
 * 「投递管理」导航入口 + 未读徽标。
 * 仅当本浏览器已登录管理账号（本地令牌）时显示——候选人看不到入口；
 * 未读数在打开页面时查一次，之后固定在每天 9:00 刷新。
 */

/** 距离下一个 9:00 的毫秒数 */
function msUntilNextNine(): number {
  const now = new Date()
  const next = new Date(now)
  next.setHours(9, 0, 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

export default function AdminNavLink({ mobile = false, onClick }: { mobile?: boolean; onClick?: () => void }) {
  const [unread, setUnread] = useState<number | null>(null)

  useEffect(() => {
    if (!siteConfig.api.baseUrl) return
    const token = localStorage.getItem('qh_admin_token')
    if (!token) return
    let stop = false
    const check = async () => {
      try {
        const res = await fetch(`${siteConfig.api.baseUrl}/api/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (stop) return
        if (res.status === 401) {
          localStorage.removeItem('qh_admin_token')
          setUnread(null)
          return
        }
        if (!res.ok) return
        const data = (await res.json()) as { count: number }
        if (!stop) setUnread(data.count)
      } catch {
        /* 网络错误保持原状 */
      }
    }
    check()
    // 打开页面时查一次；之后固定在每天 9:00 刷新（页面没开时，下次打开会自然补上）
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      check()
      timer = setTimeout(tick, msUntilNextNine())
    }
    timer = setTimeout(tick, msUntilNextNine())
    return () => {
      stop = true
      clearTimeout(timer)
    }
  }, [])

  if (unread === null) return null

  return (
    <NavLink
      to="/admin"
      onClick={onClick}
      className={({ isActive }) =>
        `relative rounded-md text-sm transition-colors ${
          mobile ? 'block px-3 py-2.5' : 'px-3 py-2'
        } ${
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        }`
      }
    >
      投递管理
      {unread > 0 && (
        <span className="absolute right-0 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </NavLink>
  )
}
