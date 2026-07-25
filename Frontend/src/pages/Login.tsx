import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { authService } from '../services/auth';

export function Login() {
  const navigate = useNavigate();
  const { setToken } = useStore();
  
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ userName: '', password: '', general: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors = { userName: '', password: '', general: '' };
    let hasError = false;
    
    if (!userName.trim()) {
      newErrors.userName = 'El usuario es requerido';
      hasError = true;
    }
    
    if (!password.trim()) {
      newErrors.password = 'La contraseña es requerida';
      hasError = true;
    }
    
    setErrors(newErrors);
    
    if (hasError) return;
    
    // Call real API
    setIsLoading(true);
    try {
      const token = await authService.login({ userName: userName.trim(), password });
      setToken(token);
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err instanceof Error && err.message) ||
        (typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: string } }).response?.data
          : null) ||
        'Error al conectar con el servidor';
      setErrors(prev => ({ ...prev, general: message }));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">
            ShopMGR
          </h1>
          <p className="text-[var(--color-muted)] mt-2 text-sm">
            Gestión de talleres y clientes
          </p>
        </div>
        
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="card space-y-4">
          {/* General error */}
          {errors.general && (
            <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20">
              <p className="text-sm text-[var(--color-danger)] text-center">{errors.general}</p>
            </div>
          )}
          
          {/* UserName Field */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Tu usuario"
                className="input pl-11"
                autoFocus
              />
            </div>
            {errors.userName && (
              <p className="text-sm text-[var(--color-danger)] mt-1">{errors.userName}</p>
            )}
          </div>
          
          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-11"
              />
            </div>
            {errors.password && (
              <p className="text-sm text-[var(--color-danger)] mt-1">{errors.password}</p>
            )}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
