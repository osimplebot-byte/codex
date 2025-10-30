import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthError, Session, SupabaseClient } from '@supabase/supabase-js'
import { supabase as supabaseClient } from '../lib/supabaseClient'

type AuthContextValue = {
  supabase: SupabaseClient | undefined
  session: Session | null
  loading: boolean
  signIn: (params: { email: string; password: string }) => Promise<AuthError | null>
  signUp: (params: { email: string; password: string }) => Promise<AuthError | null>
  signOut: () => Promise<AuthError | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const buildConfigError = (message: string) => {
  const error = new Error(message) as AuthError
  error.name = 'SupabaseError'
  error.status = 400
  return error
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseClient) {
      setLoading(false)
      return
    }

    supabaseClient.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      supabase: supabaseClient,
      session,
      loading,
      async signIn({ email, password }) {
        if (!supabaseClient) {
          return buildConfigError('Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
        }
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
        return error
      },
      async signUp({ email, password }) {
        if (!supabaseClient) {
          return buildConfigError('Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
        }
        const { error } = await supabaseClient.auth.signUp({ email, password })
        return error
      },
      async signOut() {
        if (!supabaseClient) {
          return buildConfigError('Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
        }
        const { error } = await supabaseClient.auth.signOut()
        return error
      },
    }),
    [loading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
