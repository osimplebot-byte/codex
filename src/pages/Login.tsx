import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { Spinner } from '../components/common/Spinner'

export const LoginPage = () => {
  const { session, signIn, signUp, loading } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setError(null)
    setSuccessMessage(null)

    const action = mode === 'login' ? signIn : signUp
    const responseError = await action({
      email: form.email,
      password: form.password,
    })

    if (responseError) {
      setError(responseError.message)
    } else if (mode === 'register') {
      setSuccessMessage('Cadastro realizado! Confirme o email antes de acessar o dashboard.')
    }

    setPending(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-surface/70 p-10 text-white shadow-2xl shadow-slate-950/50 backdrop-blur">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-light">Supabase + n8n + HostGator</p>
          <h1 className="text-2xl font-bold">
            {mode === 'login' ? 'Acesse sua conta' : 'Crie uma nova conta'}
          </h1>
          <p className="text-sm text-slate-300">
            Utilize suas credenciais do Supabase Auth para entrar no painel administrativo.
          </p>
        </div>

        {loading ? (
          <Spinner label="Verificando sessão" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
            >
              {pending ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
            {error ? <p className="text-xs text-rose-400">{error}</p> : null}
            {successMessage ? <p className="text-xs text-emerald-400">{successMessage}</p> : null}
          </form>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{mode === 'login' ? 'Primeiro acesso?' : 'Já possui conta?'}</span>
          <button
            type="button"
            onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
            className="font-semibold text-primary hover:text-primary-light"
          >
            {mode === 'login' ? 'Criar conta' : 'Fazer login'}
          </button>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          Ao continuar você concorda com a{' '}
          <a href="https://supabase.com/terms" target="_blank" rel="noreferrer" className="text-primary hover:text-primary-light">
            política de uso do Supabase
          </a>
          .
        </div>
      </div>
    </div>
  )
}

export default LoginPage
