import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import { useAuth } from './providers/AuthProvider'

const App = () => {
  const { session, loading } = useAuth()

  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
      <Route
        path="/login"
        element={session && !loading ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="*"
        element={<Navigate to={session ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  )
}

export default App
