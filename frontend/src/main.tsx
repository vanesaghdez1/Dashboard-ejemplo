import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import { Layout } from './components/Layout'
import { AuthProvider } from './features/auth/AuthProvider'
import { RequireAuth, RoleGate } from './features/auth/RouteGuards'
import { DASHBOARD_ROLES } from './features/auth/auth-context'
import { ApiError } from './lib/api'

// Un solo QueryClient para toda la app: guarda la caché de respuestas de la API.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // los datos se consideran frescos 1 minuto
      refetchOnWindowFocus: false,
      // No reintentar errores de permisos: no van a cambiar solos.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && [401, 403].includes(error.status)) && failureCount < 1,
    },
  },
})

const router = createBrowserRouter([
  // Pública
  {
    path: '/login',
    lazy: () => import('./features/auth/LoginPage').then((m) => ({ Component: m.LoginPage })),
  },
  // Privada: requiere sesión
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    // "lazy": cada página se descarga solo cuando se visita (code splitting).
    children: [
      {
        // Solo Admin y Gerente
        element: <RoleGate roles={DASHBOARD_ROLES} />,
        children: [
          {
            index: true,
            lazy: () => import('./features/dashboard/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
          },
        ],
      },
      {
        path: 'products',
        lazy: () => import('./features/products/ProductsPage').then((m) => ({ Component: m.ProductsPage })),
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
