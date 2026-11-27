/**
 * 成功案例自动收录器 —— 不需要手动维护列表。
 * src/content/cases/ 目录下所有 case-*.ts 文件会被自动收集并按日期倒序排列。
 * 新增案例 = 新建一个 case-*.ts 文件；删除案例 = 删除对应文件。
 */
import type { SuccessCase } from '@/types/case'

const modules = import.meta.glob('./*.ts', { eager: true }) as Record<
  string,
  { default: SuccessCase }
>

const cases: SuccessCase[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1))

export function getAllCases(): SuccessCase[] {
  return cases
}
