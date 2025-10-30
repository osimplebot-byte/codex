import clsx from 'clsx'

export const Card = ({
  title,
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}) => {
  return (
    <section
      className={clsx(
        'rounded-2xl border border-slate-800 bg-surface/70 p-6 shadow-lg shadow-slate-900/20 backdrop-blur',
        className,
      )}
    >
      {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      <div className={clsx(title || description ? 'mt-4' : '')}>{children}</div>
    </section>
  )
}
