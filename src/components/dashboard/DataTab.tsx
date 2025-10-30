import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { Card } from '../common/Card'
import { Spinner } from '../common/Spinner'

type RecordItem = {
  id: string
  name: string
  value: number
  created_at?: string
  [key: string]: unknown
}

type FormState = {
  name: string
  value: string
}

const initialForm: FormState = { name: '', value: '' }

export const DataTab = () => {
  const { supabase } = useAuth()
  const [records, setRecords] = useState<RecordItem[]>([])
  const [formState, setFormState] = useState<FormState>(initialForm)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupabaseConfigured = useMemo(() => Boolean(supabase), [supabase])

  const fetchRecords = useCallback(async () => {
    if (!supabase) {
      setError('Configure o Supabase para listar os dados.')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('records')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<RecordItem[]>()

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setRecords(data ?? [])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void fetchRecords()
  }, [fetchRecords])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) {
      setError('Configure o Supabase para inserir registros.')
      return
    }

    setUpdating(true)
    setError(null)

    const payload = {
      name: formState.name.trim(),
      value: Number(formState.value),
    }

    const { error: insertError } = await supabase.from('records').insert(payload)

    if (insertError) {
      setError(insertError.message)
    } else {
      setFormState(initialForm)
      await fetchRecords()
    }

    setUpdating(false)
  }

  const handleDelete = async (id: string) => {
    if (!supabase) {
      setError('Configure o Supabase para remover registros.')
      return
    }

    setUpdating(true)
    setError(null)

    const { error: deleteError } = await supabase.from('records').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      await fetchRecords()
    }

    setUpdating(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card
        title="Novo registro"
        description="Insira registros na tabela 'records'. Personalize os campos conforme a estrutura do seu banco."
        className="lg:col-span-2"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nome</label>
            <input
              type="text"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Informe um nome"
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valor</label>
            <input
              type="number"
              value={formState.value}
              onChange={(event) => setFormState((prev) => ({ ...prev, value: event.target.value }))}
              placeholder="0"
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={updating}
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating ? 'Salvando...' : 'Adicionar registro'}
          </button>
          {!isSupabaseConfigured ? (
            <p className="text-xs text-amber-400">
              Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar o CRUD.
            </p>
          ) : null}
          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
        </form>
      </Card>

      <Card
        title="Registros"
        description="Consulte, atualize e remova dados existentes na sua instância Supabase."
        className="lg:col-span-3"
      >
        {loading ? (
          <Spinner label="Carregando dados" />
        ) : records.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nenhum registro encontrado. Adicione um novo item ou conecte uma tabela existente chamada 'records'.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Criado em</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-3 font-medium text-white">{String(record.name ?? '')}</td>
                      <td className="px-4 py-3">{Number(record.value ?? 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {record.created_at
                          ? new Date(record.created_at).toLocaleString('pt-BR')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void handleDelete(record.id)}
                          className="rounded-lg border border-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-300 transition hover:border-rose-500 hover:text-rose-200"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{records.length} itens encontrados</span>
              <button
                type="button"
                onClick={() => void fetchRecords()}
                className="text-primary hover:text-primary-light"
                disabled={loading}
              >
                Atualizar lista
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
