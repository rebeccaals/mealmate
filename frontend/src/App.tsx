import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import RecipesPage from '@/pages/RecipesPage'
import RecipeDetailPage from '@/pages/RecipeDetailPage'
import RecipeForm from '@/components/recipes/RecipeForm'
import MenuPage from '@/pages/MenuPage'
import ShoppingPage from '@/pages/ShoppingPage'

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
        <Route index element={<Navigate to="/recipes" replace />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="recipes/new" element={<RecipeForm />} />
        <Route path="recipes/:id" element={<RecipeDetailPage />} />
        <Route path="recipes/:id/edit" element={<RecipeForm />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
      </Route>
    </Routes>
  )
}
