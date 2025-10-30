const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, '')
const normalizePath = (path: string) => path.replace(/^\//, '')

const getBaseUrl = () => {
  const value = import.meta.env.VITE_API_BASE_URL
  if (!value) {
    throw new Error('Defina VITE_API_BASE_URL para habilitar as integrações REST (n8n ou Edge Functions).')
  }
  return normalizeBaseUrl(value)
}

export type SimulationPayload = {
  amount: number
  term: number
  rate: number
  [key: string]: unknown
}

export type SimulationResponse = {
  total: number
  monthly: number
  breakdown?: Array<{ label: string; value: number }>
  metadata?: Record<string, unknown>
}

export type ConnectionStatus = {
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
  details?: string
}

export const postSimulation = async (payload: SimulationPayload) => {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/${normalizePath('simulate')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Não foi possível executar a simulação.')
  }

  return (await response.json()) as SimulationResponse
}

export const fetchConnectionStatus = async () => {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/${normalizePath('connection/status')}`)
  if (!response.ok) {
    throw new Error('Não foi possível consultar o status da conexão.')
  }
  return (await response.json()) as ConnectionStatus
}

export const triggerConnectionSync = async () => {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/${normalizePath('connection/sync')}`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error('Não foi possível iniciar a sincronização.')
  }
  return (await response.json()) as { message?: string; [key: string]: unknown }
}

export const fetchHelpArticles = async () => {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/${normalizePath('help/articles')}`)
  if (!response.ok) {
    throw new Error('Não foi possível carregar os artigos de ajuda.')
  }
  return (await response.json()) as Array<{
    id: string
    title: string
    description?: string
    url?: string
  }>
}
