import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import OppskrifterPage from '@/pages/OppskrifterPage'
import OppskriftDetailPage from '@/pages/OppskriftDetailPage'
import OppskriftForm from '@/components/oppskrifter/OppskriftForm'
import UkesmenyPage from '@/pages/UkesmenyPage'
import HandlelistePage from '@/pages/HandlelistePage'
import ButikkvarerPage from '@/pages/ButikkvarerPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((state) => state.auth.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/oppskrifter" replace />} />
        <Route path="oppskrifter" element={<OppskrifterPage />} />
        <Route path="oppskrifter/ny" element={<OppskriftForm />} />
        <Route path="oppskrifter/:id" element={<OppskriftDetailPage />} />
        <Route path="oppskrifter/:id/rediger" element={<OppskriftForm />} />
        <Route path="ukesmeny" element={<UkesmenyPage />} />
        <Route path="handleliste" element={<HandlelistePage />} />
        <Route path="butikkvarer" element={<ButikkvarerPage />} />
      </Route>
    </Routes>
  )
}
