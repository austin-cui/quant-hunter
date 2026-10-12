import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { siteConfig } from '@/config/site'

/**
 * 表单投递 —— 写入 Supabase：文本字段进 submissions 表，简历附件进 resumes 存储桶。
 * 数据库策略：匿名用户只能写入，读取/标记已读仅限 /admin 登录账号（authenticated）。
 * siteConfig.supabase.url / anonKey 留空时返回 not-configured，调用方回退为 mailto 投递。
 */
let client: SupabaseClient | null = null

export function isFormConfigured(): boolean {
  return Boolean(siteConfig.supabase.url && siteConfig.supabase.anonKey)
}

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(siteConfig.supabase.url, siteConfig.supabase.anonKey)
  }
  return client
}

export type SubmitResult = { ok: boolean; reason: 'not-configured' | 'sent' | 'error' }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * 带重试的写入。背景：Supabase 网关间歇性对合法匿名插入返回 401（官方已知事故），
 * 错误窗口内重试没有意义，但窗口随时可能翻转；且偶发"返回 401 实际已写入"。
 * 用 client_token 唯一索引保证幂等：重复插入只会撞唯一约束（409），视为成功。
 */
async function insertWithRetry(supabase: SupabaseClient, payload: Record<string, unknown>): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from('submissions').insert(payload)
    if (!error) return true
    if (error.code === '409' || /duplicate key|unique/i.test(error.message)) return true
    if (attempt < 4) await sleep(1500 * (attempt + 1))
  }
  return false
}

export async function submitApplication(fields: {
  type: 'apply' | 'register'
  name: string
  email: string
  jobTitle?: string
  direction?: string
  region?: string
  intro?: string
  resume?: File | null
}): Promise<SubmitResult> {
  if (!isFormConfigured()) return { ok: false, reason: 'not-configured' }
  const supabase = getClient()

  let resumePath: string | null = null
  if (fields.resume) {
    const safeName = fields.resume.name.replace(/[^\w.\-一-龥]+/g, '_')
    resumePath = `${fields.type}/${Date.now()}-${crypto.randomUUID()}-${safeName}`
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error: upErr } = await supabase.storage.from('resumes').upload(resumePath, fields.resume, {
        contentType: fields.resume.type || 'application/octet-stream',
      })
      if (!upErr) break
      if (attempt === 2) return { ok: false, reason: 'error' }
      await sleep(1500)
    }
  }

  const ok = await insertWithRetry(supabase, {
    type: fields.type,
    name: fields.name,
    email: fields.email,
    job_title: fields.jobTitle ?? null,
    direction: fields.direction ?? null,
    region: fields.region ?? null,
    intro: fields.intro ?? null,
    resume_path: resumePath,
    client_token: crypto.randomUUID(),
  })
  if (!ok) return { ok: false, reason: 'error' }
  return { ok: true, reason: 'sent' }
}
