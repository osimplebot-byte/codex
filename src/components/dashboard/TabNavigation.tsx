import clsx from 'clsx'

type Tab = {
  id: string
  label: string
  description?: string
}

type TabNavigationProps = {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export const TabNavigation = ({ tabs, activeTab, onChange }: TabNavigationProps) => {
  return (
    <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-800 bg-surface/80 p-2">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex min-w-[140px] flex-col rounded-xl border px-4 py-3 text-left transition-colors duration-200',
              isActive
                ? 'border-primary/70 bg-primary/10 text-white shadow-inner shadow-primary/30'
                : 'border-transparent bg-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/40 hover:text-slate-100',
            )}
          >
            <span className="text-sm font-semibold uppercase tracking-wide">{tab.label}</span>
            {tab.description ? (
              <span className="mt-1 text-xs text-slate-400">{tab.description}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
