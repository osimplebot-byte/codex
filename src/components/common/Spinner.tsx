import clsx from 'clsx'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

export const Spinner = ({ size = 'md', label, className }: SpinnerProps) => {
  return (
    <div className={clsx('flex flex-col items-center gap-2 text-slate-300', className)}>
      <span
        className={clsx(
          'inline-flex animate-spin rounded-full border-primary border-b-transparent',
          sizeMap[size],
        )}
      />
      {label ? <span className="text-sm font-medium text-slate-400">{label}</span> : null}
    </div>
  )
}
