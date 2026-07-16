import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { FAB } from './components/FAB';
import { HoursModal } from './components/HoursModal';
import { ClienteForm } from './components/ClienteForm';
import { PresupuestoForm } from './components/PresupuestoForm';
import { TrabajoForm } from './components/TrabajoForm';
import { MovimientoModal } from './components/MovimientoModal';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { ClienteDetalle } from './pages/ClienteDetalle';
import { Trabajos } from './pages/Trabajos';
import { TrabajoDetalle } from './pages/TrabajoDetalle';
import { Presupuestos } from './pages/Presupuestos';
import { PresupuestoDetalle } from './pages/PresupuestoDetalle';
import { Configuracion } from './pages/Configuracion';
import { Login } from './pages/Login';
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
  const { isAuthenticated, setShowHoursModal, setShowClienteForm, setShowPresupuestoForm, setShowTrabajoForm, setShowMovimientoModal, imageFullscreenOpen } = useStore();
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
  if (!isAuthenticated) {
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
        <Outlet />
      </div>
      <BottomNav />
      {!imageFullscreenOpen && (
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
  const { isAuthenticated } = useStore();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  
  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }
  
  return <Login />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/:id" element={<ClienteDetalle />} />
            <Route path="/trabajos" element={<Trabajos />} />
            <Route path="/trabajos/:id" element={<TrabajoDetalle />} />
            <Route path="/presupuestos" element={<Presupuestos />} />
            <Route path="/presupuestos/:id" element={<PresupuestoDetalle />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;