import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import AppLayout from './components/layout/AppLayout.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import AuthProvider from './context/AuthProvider.tsx'
import AddProductPage from './pages/AddProductPage.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import EditProductPage from './pages/EditProductPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import ProductsPage from './pages/ProductsPage.tsx'
import SignupPage from './pages/SignupPage.tsx'

export type AppProps = Record<string, never>

export default function App(_props: AppProps): React.JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<AddProductPage />} />
              <Route path="/products/:id/edit" element={<EditProductPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
