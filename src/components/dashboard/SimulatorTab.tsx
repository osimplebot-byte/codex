import { useState } from 'react'
import type { FormEvent } from 'react'
import { Card } from '../common/Card'
import { Spinner } from '../common/Spinner'
import { postSimulation, type SimulationResponse } from '../../services/api'

type FormState = {
  amount: string
  rate: string
  term: string
}

const initialState: FormState = {
  amount: '15000',
  rate: '1.9',
  term: '12',
}

export const SimulatorTab = () => {
  const [form, setForm] = useState<FormState>(initialState)
  const [result, setResult] = useState<SimulationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        amount: Number(form.amount),
        rate: Number(form.rate),
        term: Number(form.term),
      }
      const response = await postSimulation(payload)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar simulação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card
        title="Simulador"
        description="Envie os parâmetros financeiros para o fluxo do n8n ou Edge Function configurado no Supabase."
        className="lg:col-span-2"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valor (R$)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Juros mensal (%)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.rate}
                onChange={(event) => setForm((prev) => ({ ...prev, rate: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Parcelas</label>
              <input
                type="number"
                min={1}
                step="1"
                value={form.term}
                onChange={(event) => setForm((prev) => ({ ...prev, term: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Processando...' : 'Calcular'}
          </button>
          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
          <p className="text-xs text-slate-400">
            Ajuste o endpoint <code className="rounded bg-slate-900/70 px-1">/simulate</code> no fluxo para personalizar o cálculo.
          </p>
        </form>
      </Card>

      <Card
        title="Resultado"
        description="Os dados retornados do endpoint são exibidos aqui. Personalize conforme as regras do seu negócio."
        className="lg:col-span-3"
      >
        {loading ? (
          <Spinner label="Calculando" />
        ) : result ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-slate-200">Resumo</h3>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Valor total</dt>
                  <dd className="text-lg font-semibold text-white">
                    {result.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Parcela mensal</dt>
                  <dd className="text-lg font-semibold text-white">
                    {result.monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Parcelas</dt>
                  <dd className="text-lg font-semibold text-white">{form.term}</dd>
                </div>
              </dl>
            </div>
            {result.breakdown && result.breakdown.length > 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="text-sm font-semibold text-slate-200">Detalhamento</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {result.breakdown.map((item) => (
                    <li key={item.label} className="flex items-center justify-between">
                      <span>{item.label}</span>
                      <span>{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.metadata ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="text-sm font-semibold text-slate-200">Metadados</h3>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950/80 p-4 text-xs text-slate-300">
                  {JSON.stringify(result.metadata, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Execute uma simulação para visualizar os resultados retornados pelo seu endpoint.
          </p>
        )}
      </Card>
    </div>
  )
}
