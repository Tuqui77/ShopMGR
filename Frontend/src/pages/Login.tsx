import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, Loader2, UserPlus } from 'lucide-react';
import { useStore } from '../store';
import { authService } from '../services/auth';

export function Login() {
  const navigate = useNavigate();
  const { setTokens } = useStore();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ userName: '', password: '', general: '', success: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors = { userName: '', password: '', general: '', success: '' };
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
    
    setIsLoading(true);
    try {
      if (isRegistering) {
        await authService.register({ userName: userName.trim(), password });
        setErrors(prev => ({ ...prev, success: 'Usuario creado. Ahora podés iniciar sesión.' }));
        setIsRegistering(false);
        setPassword('');
      } else {
        const { accessToken, refreshToken } = await authService.login({ userName: userName.trim(), password });
        setTokens(accessToken, refreshToken);
        navigate('/');
      }
    } catch (err: unknown) {
      const axiosData = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: unknown } }).response?.data
        : null;
      const message = typeof axiosData === 'string'
        ? axiosData
        : 'Error al conectar con el servidor';
      setErrors(prev => ({ ...prev, general: message }));
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setErrors({ userName: '', password: '', general: '', success: '' });
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
        
        {/* Login/Register Form */}
        <form onSubmit={handleSubmit} className="card space-y-4">
          {/* General error */}
          {errors.general && (
            <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20">
              <p className="text-sm text-[var(--color-danger)] text-center">{errors.general}</p>
            </div>
          )}
          
          {/* Success message */}
          {errors.success && (
            <div className="p-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
              <p className="text-sm text-[var(--color-success)] text-center">{errors.success}</p>
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
                className="input !pl-11"
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
                className="input !pl-11"
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
            ) : isRegistering ? (
              <UserPlus className="w-5 h-5" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoading
              ? (isRegistering ? 'Creando...' : 'Ingresando...')
              : (isRegistering ? 'Crear Usuario' : 'Iniciar Sesión')
            }
          </button>
          
          {/* Toggle Login/Register */}
          <p className="text-center text-sm text-[var(--color-muted)]">
            {isRegistering ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-[var(--color-accent)] hover:underline px-1 rounded transition-colors duration-200"
            >
              {isRegistering ? 'Iniciar Sesión' : 'Crear Usuario'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
