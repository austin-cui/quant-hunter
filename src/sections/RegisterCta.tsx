import { useState } from 'react'
import { Send, ShieldCheck, Paperclip, CheckCircle2, Loader2 } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { isFormConfigured, submitApplication } from '@/lib/submit'
import SectionHeading from '@/components/site/SectionHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/** 候选人登记：配置 formAccessKey 后直接上传简历提交；未配置时回退为邮件客户端预填 */
export default function RegisterCta() {
  const hasForm = isFormConfigured()
  const [form, setForm] = useState({
    name: '',
    email: '',
    direction: '',
    region: '',
    intro: '',
  })
  const [resume, setResume] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const mailtoFallback = () => {
    const subject = encodeURIComponent(
      `【候选人登记】${form.name || '未署名'} · ${form.direction || '方向待定'}`,
    )
    const body = encodeURIComponent(
      [
        `姓名：${form.name}`,
        `邮箱：${form.email}`,
        `意向方向：${form.direction}`,
        `意向地区：${form.region}`,
        '',
        '一句话介绍：',
        form.intro,
        '',
        '（通过官网登记表单发送）',
      ].join('\n'),
    )
    window.location.href = `mailto:${siteConfig.contact.email}?subject=${subject}&body=${body}`
    setStatus('sent')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasForm) return mailtoFallback()
    setStatus('sending')
    const res = await submitApplication({
      type: 'register',
      name: form.name,
      email: form.email,
      direction: form.direction,
      region: form.region,
      intro: form.intro,
      resume,
    })
    setStatus(res.ok ? 'sent' : 'error')
  }

  if (status === 'sent') {
    return (
      <section className="border-t border-border/60 bg-card/20">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-bold">登记已收到</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {hasForm
              ? '简历已提交成功，工作日 48 小时内会收到回复，请留意邮箱。'
              : '已为你打开邮件客户端，点击发送即完成登记；工作日 48 小时内回复。'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="register" className="border-t border-border/60 bg-card/20">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Join Talent Pool"
          title="没看到合适岗位？先登记简历"
          desc="留下邮箱与意向方向，3-6 个月内有匹配岗位我会主动联系你。"
        />
        <form
          onSubmit={submit}
          className="rounded-xl border border-border bg-card p-6 sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted-foreground">姓名 *</span>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="怎么称呼你"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted-foreground">邮箱 *</span>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="接收岗位推荐的邮箱"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted-foreground">意向方向 *</span>
              <Input
                required
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value })}
                placeholder="如：量化研究 / C++ 开发 / 机器学习"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted-foreground">意向地区</span>
              <Input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="如：上海 / 香港 / 新加坡"
              />
            </label>
          </div>
          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block text-muted-foreground">
              一句话介绍自己（可选）
            </span>
            <Textarea
              rows={3}
              value={form.intro}
              onChange={(e) => setForm({ ...form, intro: e.target.value })}
              placeholder="背景、经验、亮点，随便聊聊"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block text-muted-foreground">
              简历附件（PDF，可选）
            </span>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResume(e.target.files?.[0] ?? null)}
              className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:text-primary"
            />
          </label>
          {status === 'error' && (
            <p className="mt-4 text-sm text-red-500">
              提交未成功，请直接把简历发送至 {siteConfig.contact.email}
            </p>
          )}
          {hasForm && (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              在线提交需连接 VPN；无法提交时，请直接把简历发送至 {siteConfig.contact.email}。
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={status === 'sending'}
            className="mt-6 w-full gap-2 font-semibold"
          >
            {status === 'sending' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {hasForm ? '提交登记' : '发送登记邮件'}
          </Button>
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {siteConfig.privacyNote}
            {hasForm && <Paperclip className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
            {!hasForm && '（点击后会打开你的邮件客户端预填好内容，发送即完成登记）'}
          </p>
        </form>
      </div>
    </section>
  )
}
