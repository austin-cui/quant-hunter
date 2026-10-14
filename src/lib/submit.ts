import { siteConfig } from '@/config/site'

/**
 * 表单投递 —— 写入 Cloudflare Worker（D1 表 + R2 简历附件）。
 * 2026-10-13 从 Supabase 迁移：免费版匿名网关按时间段翻转、间歇性拒绝写入，无法根治。
 * siteConfig.api.baseUrl 留空时返回 not-configured，调用方回退为 mailto 投递。
 */

export function isFormConfigured(): boolean {
  return Boolean(siteConfig.api.baseUrl)
}

export type SubmitResult = { ok: boolean; reason: 'not-configured' | 'sent' | 'error' }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fileToBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer())
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode(...buf.subarray(i, i + chunk))
  }
  return btoa(bin)
}

/**
 * 带重试的写入。client_token 幂等：Worker 对重复 token 返回 duplicated，
 * 视为成功；网络层错误按指数退避重试 3 次。
 */
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

  const clientToken = crypto.randomUUID()
  const resume = fields.resume
    ? { name: fields.resume.name, type: fields.resume.type || 'application/octet-stream', data: await fileToBase64(fields.resume) }
    : null

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${siteConfig.api.baseUrl}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: fields.type,
          name: fields.name,
          email: fields.email,
          job_title: fields.jobTitle ?? null,
          direction: fields.direction ?? null,
          region: fields.region ?? null,
          intro: fields.intro ?? null,
          client_token: clientToken,
          resume,
        }),
      })
      if (res.status === 201 || res.status === 200) return { ok: true, reason: 'sent' }
      if (res.status === 400 || res.status === 413) return { ok: false, reason: 'error' } // 参数问题重试无意义
    } catch {
      // 网络错误，继续重试
    }
    if (attempt < 2) await sleep(1500 * (attempt + 1))
  }
  return { ok: false, reason: 'error' }
}
