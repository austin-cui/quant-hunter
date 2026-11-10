import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { siteConfig } from '@/config/site'

export const ADMIN_TOKEN_KEY = 'qh-admin-token'

/**
 * 导航栏「投递管理」入口 + 未读徽标。
 * 未读数在打开页面时查一次、固定在每天 9:00 刷新一次；
 * 管理页内的已读/删除操作会通过 qh-unread-changed 事件让这里立即重查。
 * 无 token（未登录）或接口不可达（如未挂 VPN）时不渲染，候选人视角看不到入口。
 */
export default function AdminNavLink() {
  const [unread, setUnread] = useState<number | null>(null)

  useEffect(() => {
    const base = siteConfig.api.baseUrl
    if (!base) return
    let cancelled = false

    const fetchUnread = async () => {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY)
      if (!token) {
        if (!cancelled) setUnread(null)
        return
      }
      try {
        const res = await fetch(`${base}/api/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401) {
          localStorage.removeItem(ADMIN_TOKEN_KEY)
          if (!cancelled) setUnread(null)
          return
        }
        if (!res.ok) return // 网络层不可达（如未挂 VPN）保持现状，不闪没
        const data = await res.json()
        if (!cancelled) setUnread(data.count ?? 0)
      } catch {
        /* 网络错误静默：不打断页面 */
      }
    }

    fetchUnread()
    window.addEventListener('qh-unread-changed', fetchUnread)

    // 每天 9:00 固定刷新一次（页面没开时，下次打开会自然补上）
    const now = new Date()
    const next9 = new Date(now)
    next9.setHours(9, 0, 0, 0)
    if (next9.getTime() <= now.getTime()) next9.setDate(next9.getDate() + 1)
    const timer = setTimeout(fetchUnread, next9.getTime() - now.getTime())

    return () => {
      cancelled = true
      window.removeEventListener('qh-unread-changed', fetchUnread)
      clearTimeout(timer)
    }
  }, [])

  if (unread === null) return null

  return (
    <Link
      to="/admin"
      className="relative rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      投递管理
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
