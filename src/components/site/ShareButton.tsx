import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** 岗位详情页的「复制链接」按钮：方便你转发时一键拿到完整 URL */
export default function ShareButton() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // 剪贴板 API 不可用时退回方案
      const ta = document.createElement('textarea')
      ta.value = window.location.href
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
      {copied ? (
        <>
          <Check className="h-4 w-4 text-primary" />
          已复制
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          复制岗位链接
        </>
      )}
    </Button>
  )
}
