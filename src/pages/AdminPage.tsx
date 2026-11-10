import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Download,
  Loader2,
  LogOut,
  Mail,
  Paperclip,
  Pin,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ADMIN_TOKEN_KEY } from '@/components/site/AdminNavLink'

type Row = {
  id: number
  created_at: string
  type: 'apply' | 'register'
  name: string
  email: string
  job_title: string | null
  direction: string | null
  region: string | null
  intro: string | null
  resume_path: string | null
  read: number
  pinned: number
}

function notifyUnreadChanged() {
  window.dispatchEvent(new CustomEvent('qh-unread-changed'))
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 投递管理：登录（令牌 30 天）→ 列表 / 已读 / 置顶 / 删除 / 下载简历 */
export default function AdminPage() {
  const base = siteConfig.api.baseUrl
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ADMIN_TOKEN_KEY))
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  // 登录表单
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')

  const load = useCallback(async () => {
    if (!base || !token) return
    setBusy(true)
    setErr('')
    try {
      const res = await fetch(`${base}/api/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        setToken(null)
        setErr('登录已过期，请重新登录')
        return
      }
      if (!res.ok) throw new Error(`加载失败（HTTP ${res.status}）`)
      const data = await res.json()
      const list: Row[] = data.rows ?? []
      list.sort(
        (a, b) =>
          (b.pinned - a.pinned) ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      setRows(list)
    } catch (e: any) {
      setErr(e?.message || '加载失败，请检查网络（管理页需要 VPN）')
    } finally {
      setBusy(false)
    }
  }, [base, token])

  useEffect(() => {
    if (token) load()
  }, [token, load])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!base) return
    setLoginErr('')
    setBusy(true)
    try {
      const res = await fetch(`${base}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error(res.status === 401 ? '邮箱或密码不正确' : `登录失败（HTTP ${res.status}）`)
      const data = await res.json()
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
      setToken(data.token)
      notifyUnreadChanged() // 让导航栏未读徽标立刻出现
    } catch (e: any) {
      setLoginErr(e?.message || '登录失败，请检查网络（管理页需要 VPN）')
    } finally {
      setBusy(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setToken(null)
    setRows(null)
  }

  const call = async (path: string, init: RequestInit = {}) => {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
    if (!res.ok) throw new Error(`操作失败（HTTP ${res.status}）`)
    return res
  }

  const mutate = async (fn: () => Promise<unknown>) => {
    try {
      await fn()
      await load()
      notifyUnreadChanged()
    } catch (e: any) {
      setErr(e?.message || '操作失败')
    }
  }

  const setFlag = (id: number, flag: 'read' | 'pin', value: number) =>
    mutate(() => call(`/api/submissions/${id}/${flag}`, { method: 'POST', body: JSON.stringify({ value }) }))

  const remove = (id: number) => {
    if (!window.confirm('确定删除这条投递？附件会一并删除，不可恢复。')) return
    mutate(() => call(`/api/submissions/${id}`, { method: 'DELETE' }))
  }

  const download = async (r: Row) => {
    if (!r.resume_path) return
    try {
      const res = await fetch(`${base}/api/resume/${encodeURIComponent(r.resume_path)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`下载失败（HTTP ${res.status}）`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = r.resume_path.split('/').pop() || 'resume.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setErr(e?.message || '下载失败')
    }
  }

  /* ---------- 登录页 ---------- */
  if (!token || !base) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24">
        <form onSubmit={login} className="rounded-xl border border-border bg-card p-7">
          <h1 className="font-display text-xl font-bold">投递管理</h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            简历数据仅顾问本人可查看，登录状态保持 30 天。
          </p>
          <label className="mt-5 block text-sm">
            <span className="mb-1.5 block text-muted-foreground">邮箱</span>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1.5 block text-muted-foreground">密码</span>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {loginErr && <p className="mt-3 text-xs text-red-500">{loginErr}</p>}
          <Button type="submit" disabled={busy} className="mt-5 w-full gap-2 font-semibold">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            登录
          </Button>
        </form>
      </div>
    )
  }

  /* ---------- 列表页 ---------- */
  const unread = rows?.filter((r) => !r.read).length ?? 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">投递管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows === null ? '加载中…' : `共 ${rows.length} 条${unread > 0 ? ` · ${unread} 条未读` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={busy} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-muted-foreground">
            <LogOut className="h-3.5 w-3.5" />
            退出
          </Button>
        </div>
      </div>

      {err && <p className="mt-4 text-sm text-red-500">{err}</p>}

      <div className="mt-6 space-y-3">
        {rows?.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            暂无投递记录
          </div>
        )}
        {rows?.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border bg-card p-5 ${r.pinned ? 'border-primary/60' : 'border-border'} ${r.read ? 'opacity-80' : ''}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold">{r.name}</span>
                  {!r.read && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-500">未读</span>}
                  {r.pinned === 1 && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">置顶</span>}
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {r.type === 'apply' ? '岗位投递' : '简历登记'}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {r.email}
                  </span>
                  {r.job_title && <span>岗位：{r.job_title}</span>}
                  {r.direction && <span>方向：{r.direction}</span>}
                  {r.region && <span>地区：{r.region}</span>}
                  <span>{fmtTime(r.created_at)}</span>
                </div>
                {r.intro && <p className="mt-2 text-sm leading-relaxed">{r.intro}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {r.resume_path && (
                  <Button variant="outline" size="sm" onClick={() => download(r)} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    简历
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFlag(r.id, 'read', r.read ? 0 : 1)}
                  title={r.read ? '标为未读' : '标为已读'}
                >
                  {r.read ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFlag(r.id, 'pin', r.pinned ? 0 : 1)}
                  title={r.pinned ? '取消置顶' : '置顶'}
                >
                  <Pin className={`h-4 w-4 ${r.pinned ? 'fill-primary text-primary' : ''}`} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(r.id)} title="删除">
                  <Trash2 className="h-4 w-4 text-red-500/70" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rows && rows.length > 0 && (
        <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />
          简历附件存于加密对象存储，仅本页登录后可下载；删除记录会同时删除附件。
        </p>
      )}
    </div>
  )
}
