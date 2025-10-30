import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { Spinner } from './Spinner'

export const ProtectedRoute = () => {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner label="Carregando sessão" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
