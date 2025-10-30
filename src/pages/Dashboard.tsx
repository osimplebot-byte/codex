import { useMemo, useState } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { TabNavigation } from '../components/dashboard/TabNavigation'
import { DataTab } from '../components/dashboard/DataTab'
import { SimulatorTab } from '../components/dashboard/SimulatorTab'
import { ConnectionTab } from '../components/dashboard/ConnectionTab'
import { HelpTab } from '../components/dashboard/HelpTab'

const tabs = [
  { id: 'data', label: 'Dados', description: 'CRUD com Supabase' },
  { id: 'simulator', label: 'Simulador', description: 'Fluxos automatizados' },
  { id: 'connection', label: 'Conexão', description: 'Status das integrações' },
  { id: 'help', label: 'Ajuda', description: 'Documentação e suporte' },
]

export const DashboardPage = () => {
  const { session, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('data')

  const renderTab = useMemo(() => {
    switch (activeTab) {
      case 'simulator':
        return <SimulatorTab />
      case 'connection':
        return <ConnectionTab />
      case 'help':
        return <HelpTab />
      case 'data':
      default:
        return <DataTab />
    }
  }, [activeTab])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-surface/80 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-primary-light">Supabase Control Center</p>
              <h1 className="mt-2 text-3xl font-bold">Painel centralizado</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Conecte autenticação, banco de dados, automações no n8n e fluxos de Edge Functions em um único dashboard.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-wide text-slate-500">Usuário autenticado</span>
              <span className="font-semibold text-white">{session?.user.email ?? 'Usuário'}</span>
              <button
                type="button"
                onClick={async () => {
                  const error = await signOut()
                  if (error) {
                    console.error('Erro ao sair:', error.message)
                  }
                }}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-rose-500 hover:text-rose-300"
              >
                Sair
              </button>
            </div>
          </div>

          <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </header>

        <main className="pb-16">{renderTab}</main>
      </div>
    </div>
  )
}

export default DashboardPage
