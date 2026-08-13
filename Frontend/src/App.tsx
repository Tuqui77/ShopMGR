import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { FAB } from './components/FAB';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { HoursModal } from './components/HoursModal';
import { ClienteForm } from './components/ClienteForm';
import { PresupuestoForm } from './components/PresupuestoForm';
import { TrabajoForm } from './components/TrabajoForm';
import { MovimientoModal } from './components/MovimientoModal';
// Páginas eager: carga inicial crítica (login y dashboard)
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
// Páginas lazy: un chunk por ruta (issue #67)
const Clientes = lazy(() => import('./pages/Clientes').then(m => ({ default: m.Clientes })));
const ClienteDetalle = lazy(() => import('./pages/ClienteDetalle').then(m => ({ default: m.ClienteDetalle })));
const Trabajos = lazy(() => import('./pages/Trabajos').then(m => ({ default: m.Trabajos })));
const TrabajoDetalle = lazy(() => import('./pages/TrabajoDetalle').then(m => ({ default: m.TrabajoDetalle })));
const Presupuestos = lazy(() => import('./pages/Presupuestos').then(m => ({ default: m.Presupuestos })));
const PresupuestoDetalle = lazy(() => import('./pages/PresupuestoDetalle').then(m => ({ default: m.PresupuestoDetalle })));
const Configuracion = lazy(() => import('./pages/Configuracion').then(m => ({ default: m.Configuracion })));
const Perfil = lazy(() => import('./pages/Perfil').then(m => ({ default: m.Perfil })));
const Metricas = lazy(() => import('./pages/Metricas').then(m => ({ default: m.Metricas })));
import { useStore } from './store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function ProtectedLayout() {
  const [fabOpen, setFabOpen] = useState(false);
  const { accessToken, setShowHoursModal, setShowClienteForm, setShowPresupuestoForm, setShowTrabajoForm, setShowMovimientoModal, imageFullscreenOpen, isDetailModalOpen } = useStore();
  const location = useLocation();
  
  // Body scroll lock when any modal is open (must be before early return for hooks rule)
  const isModalOpen = useStore(s =>
    s.showHoursModal || s.showClienteForm || s.showPresupuestoForm || s.showTrabajoForm || s.showMovimientoModal
  );

  useEffect(() => {
    if (isModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isModalOpen]);
  
  // Redirect to login if not authenticated
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const handleFabAction = (action: 'hours' | 'trabajo' | 'cliente' | 'presupuesto' | 'movimiento') => {
    setFabOpen(false); // Close FAB first
    if (action === 'hours') {
      setShowHoursModal(true);
    } else if (action === 'trabajo') {
      setShowTrabajoForm(true);
    } else if (action === 'cliente') {
      setShowClienteForm(true);
    } else if (action === 'presupuesto') {
      setShowPresupuestoForm(true);
    } else if (action === 'movimiento') {
      setShowMovimientoModal(true);
    }
  };
  
  return (
    <div className="main-content with-sidebar">
      <Sidebar />
      <div className="flex-1 min-h-screen min-w-0 pb-24 lg:pb-8">
        <Suspense fallback={<LoadingSpinner message="Cargando…" />}>
          <Outlet />
        </Suspense>
      </div>
      <BottomNav />
      {!imageFullscreenOpen && !isDetailModalOpen && (
        <FAB isOpen={fabOpen} onToggle={() => setFabOpen(!fabOpen)} onAction={handleFabAction} />
      )}
      <HoursModal />
      <ClienteForm />
      <PresupuestoForm />
      <TrabajoForm />
      <MovimientoModal />
    </div>
  );
}

function LoginPage() {
  const { accessToken, cambioContraseñaPendiente } = useStore();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Si el login exige cambiar la contraseña (código de un solo uso, issue #99),
  // el token ya está seteado pero el modal de cambio debe completarse antes de
  // entrar a la app: se omite el redirect mientras el flag esté activo.
  if (accessToken && !cambioContraseñaPendiente) {
    return <Navigate to={from} replace />
  }

  return <Login />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary pageName="Aplicación">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              <Suspense fallback={<LoadingSpinner message="Cargando…" />}>
                <LoginPage />
              </Suspense>
            } />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<ErrorBoundary pageName="Dashboard"><Dashboard /></ErrorBoundary>} />
              <Route path="/clientes" element={<ErrorBoundary pageName="Clientes"><Clientes /></ErrorBoundary>} />
              <Route path="/clientes/:id" element={<ErrorBoundary pageName="Detalle de Cliente"><ClienteDetalle /></ErrorBoundary>} />
              <Route path="/trabajos" element={<ErrorBoundary pageName="Trabajos"><Trabajos /></ErrorBoundary>} />
              <Route path="/trabajos/:id" element={<ErrorBoundary pageName="Detalle de Trabajo"><TrabajoDetalle /></ErrorBoundary>} />
              <Route path="/presupuestos" element={<ErrorBoundary pageName="Presupuestos"><Presupuestos /></ErrorBoundary>} />
              <Route path="/presupuestos/:id" element={<ErrorBoundary pageName="Detalle de Presupuesto"><PresupuestoDetalle /></ErrorBoundary>} />
              <Route path="/configuracion" element={<ErrorBoundary pageName="Configuración"><Configuracion /></ErrorBoundary>} />
              <Route path="/perfil" element={<ErrorBoundary pageName="Perfil"><Perfil /></ErrorBoundary>} />
              <Route path="/metricas" element={<ErrorBoundary pageName="Métricas"><Metricas /></ErrorBoundary>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;