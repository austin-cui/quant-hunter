/**
 * 成功案例数据类型 —— 与岗位一样「一个案例一个文件」。
 * 文件放在 src/content/cases/ 下，命名 case-*.ts，default export 一个 SuccessCase。
 * 脱敏红线：不出现公司名、人名、具体金额；机构用「类型 + 城市」标签。
 */
export interface SuccessCase {
  /** 案例日期（如入职日），YYYY-MM-DD，用于排序（新的在前） */
  postedAt: string
  /** 机构标签（脱敏）：「类型 + 城市」，如「内资头部量化私募 · 上海」 */
  label: string
  /** 小徽章，如「实习转正」「远程」（可选） */
  tag?: string
  /** 案例标题：角色 + 方向 + 周期 */
  title: string
  /** 时间线与成果描述（1-2 句，用 → 串联关键节点） */
  desc: string
}
