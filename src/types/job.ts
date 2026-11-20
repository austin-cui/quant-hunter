/**
 * 岗位数据类型定义 —— 极简版。
 * 只保留三个字段：岗位名、地点 base、职责 JD。
 * 薪资、机构标签、经验要求等易变信息一律不在网站展示，
 * 需要时直接在电话/微信沟通，避免反复改网站。
 */
export interface Job {
  /** 唯一标识，同时是分享链接的地址：/jobs/<slug>。用小写字母、数字、连字符。生成后不要改（链接可能已外发）。 */
  slug: string
  /** 职位名称 */
  title: string
  /** 工作地点 base，如「香港」「上海」 */
  location: string
  /** 职责 JD */
  responsibilities: string[]
}
