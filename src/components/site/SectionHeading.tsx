interface Props {
  eyebrow?: string
  title: string
  desc?: string
}

/** 统一的区块标题：金色小标签 + 衬线大标题 */
export default function SectionHeading({ eyebrow, title, desc }: Props) {
  return (
    <div className="mb-10 text-center">
      {eyebrow && (
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
      {desc && (
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {desc}
        </p>
      )}
    </div>
  )
}
