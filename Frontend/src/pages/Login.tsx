import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import { useStore } from '../store';

export function Login() {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors = { email: '', password: '' };
    let hasError = false;
    
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
      hasError = true;
    }
    
    if (!password.trim()) {
      newErrors.password = 'La contraseña es requerida';
      hasError = true;
    }
    
    setErrors(newErrors);
    
    if (hasError) return;
    
    // Mock login - accept any valid input
    setIsAuthenticated(true);
    navigate('/');
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
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="input pl-11"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-[var(--color-danger)] mt-1">{errors.email}</p>
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
          <button type="submit" className="btn-primary flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" />
            Iniciar Sesión
          </button>
          
          {/* Forgot Password Link (decorative) */}
          <p className="text-center text-sm text-[var(--color-muted)]">
            ¿Olvidaste tu contraseña?{' '}
            <button type="button" className="text-[var(--color-accent)] hover:underline">
              Recuperar
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
