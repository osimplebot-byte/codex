import { useEffect, useState } from 'react'
import { Card } from '../common/Card'
import { Spinner } from '../common/Spinner'
import { fetchConnectionStatus, triggerConnectionSync, type ConnectionStatus } from '../../services/api'

export const ConnectionTab = () => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const statusColor = status?.status === 'connected'
    ? 'text-emerald-400'
    : status?.status === 'error'
      ? 'text-rose-400'
      : 'text-amber-300'

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    setSyncMessage(null)
    try {
      const response = await fetchConnectionStatus()
      setStatus(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStatus()
  }, [])

  const handleSync = async () => {
    setLoading(true)
    setError(null)
    setSyncMessage(null)
    try {
      const response = await triggerConnectionSync()
      setSyncMessage(response.message ?? 'Sincronização iniciada com sucesso.')
      await fetchStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sincronização.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Status da integração" description="Acompanhe a saúde da conexão entre Supabase, n8n e outros serviços.">
        {loading && !status ? (
          <Spinner label="Consultando status" />
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-slate-200">Situação atual</h3>
              <p className={`mt-2 text-lg font-semibold ${statusColor}`}>
                {status?.status === 'connected' && 'Conectado'}
                {status?.status === 'disconnected' && 'Desconectado'}
                {status?.status === 'error' && 'Com falhas'}
                {!status && 'Status indisponível'}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {status?.details ?? 'Configure o endpoint /connection/status para receber detalhes em tempo real.'}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Última sincronização:{' '}
                {status?.lastSync
                  ? new Date(status.lastSync).toLocaleString('pt-BR')
                  : 'sem registros'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void fetchStatus()}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-primary hover:text-white"
                disabled={loading}
              >
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => void handleSync()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                Sincronizar agora
              </button>
            </div>
            {syncMessage ? <p className="text-xs text-emerald-400">{syncMessage}</p> : null}
            {error ? <p className="text-xs text-rose-400">{error}</p> : null}
          </div>
        )}
      </Card>

      <Card
        title="Checklist de integração"
        description="Use esta lista para garantir que todas as credenciais e webhooks estejam atualizados."
      >
        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Verifique as variáveis <code className="rounded bg-slate-900/70 px-1">VITE_SUPABASE_URL</code> e{' '}
            <code className="rounded bg-slate-900/70 px-1">VITE_SUPABASE_ANON_KEY</code>.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Garanta que o endpoint REST <code className="rounded bg-slate-900/70 px-1">/connection/status</code> esteja ativo.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Configure o webhook do n8n para receber eventos do Supabase (INSERT, UPDATE, DELETE).
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Habilite logs no n8n ou Supabase Edge Functions para monitorar falhas.
          </li>
        </ul>
      </Card>
    </div>
  )
}
