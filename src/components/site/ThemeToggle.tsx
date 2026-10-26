import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

/**
 * 白天/夜间模式切换。
 * 默认夜间（品牌暗色）；点击切到白天（html.light）。
 * 选择持久化在 localStorage('qh-theme')，index.html 里有内联脚本在首屏前应用，避免闪烁。
 */
export default function ThemeToggle() {
  const [light, setLight] = useState(() =>
    document.documentElement.classList.contains('light'),
  )

  const toggle = () => {
    const next = !light
    setLight(next)
    document.documentElement.classList.toggle('light', next)
    try {
      localStorage.setItem('qh-theme', next ? 'light' : 'dark')
    } catch {
      /* 隐私模式等场景下忽略持久化 */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={light ? '切换到夜间模式' : '切换到白天模式'}
      title={light ? '切换到夜间模式' : '切换到白天模式'}
      className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
    >
      {light ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  )
}
