import { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { FAB } from './components/FAB';
import { HoursModal } from './components/HoursModal';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { ClienteDetalle } from './pages/ClienteDetalle';
import { Trabajos } from './pages/Trabajos';
import { TrabajoDetalle } from './pages/TrabajoDetalle';
import { Presupuestos } from './pages/Presupuestos';
import { PresupuestoDetalle } from './pages/PresupuestoDetalle';
import { useStore } from './store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function Layout() {
  const [fabOpen, setFabOpen] = useState(false);
  const { setShowHoursModal } = useStore();
  
  const handleFabAction = (action: 'hours' | 'trabajo' | 'cliente' | 'presupuesto') => {
    if (action === 'hours') {
      setShowHoursModal(true);
    }
  };
  
  return (
    <div className="main-content with-sidebar">
      <Sidebar />
      <div className="flex-1 min-h-screen pb-24 lg:pb-8">
        <Outlet />
      </div>
      <BottomNav />
      <FAB isOpen={fabOpen} onToggle={() => setFabOpen(!fabOpen)} onAction={handleFabAction} />
      <HoursModal />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/:id" element={<ClienteDetalle />} />
            <Route path="/trabajos" element={<Trabajos />} />
            <Route path="/trabajos/:id" element={<TrabajoDetalle />} />
            <Route path="/presupuestos" element={<Presupuestos />} />
            <Route path="/presupuestos/:id" element={<PresupuestoDetalle />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
