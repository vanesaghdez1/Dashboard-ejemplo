import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import { Layout } from './components/Layout'

// Un solo QueryClient para toda la app: guarda la caché de respuestas de la API.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // los datos se consideran frescos 1 minuto
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    // "lazy": cada página se descarga solo cuando se visita (code splitting).
    children: [
      {
        index: true,
        lazy: () => import('./features/dashboard/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
      },
      {
        path: 'productos',
        lazy: () => import('./features/products/ProductsPage').then((m) => ({ Component: m.ProductsPage })),
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
