import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-32 text-center">
      <div className="font-display text-7xl font-bold text-gold-gradient">404</div>
      <p className="mt-6 text-lg text-muted-foreground">页面不存在或已移动</p>
      <Button asChild className="mt-10">
        <Link to="/">回到首页</Link>
      </Button>
    </div>
  )
}
