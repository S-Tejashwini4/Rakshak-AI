import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useToastStore } from '../store/toastStore';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const { users } = useUserStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    addToast('Authenticating via Catalyst UserManagement...', 'info');
    
    try {
      const response = await fetch('/server/rakshak_function/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password })
      });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        if (data.user.status !== 'Active') {
          addToast('This account has been suspended.', 'error');
          return;
        }
        login(data.user);
        addToast(`Catalyst Auth Success: Welcome back, ${data.user.name}`, 'success');
        navigate('/dashboard');
      } else {
        addToast(data.error || 'Invalid username or password.', 'error');
      }
    } catch (error) {
      addToast('Catalyst Authentication service is unreachable.', 'error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center relative overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="glass p-10 rounded-2xl w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4 overflow-hidden border-2 border-primary/50 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
          >
            <img src="/logo.png" alt="Rakshak AI" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-2xl font-bold text-center tracking-wider text-gray-900 dark:text-white">{t('login_title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">{t('login_subtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input 
              type="text" 
              placeholder="Username"
              className="w-full bg-white dark:bg-black/30 border border-gray-300 dark:border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-900 dark:text-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Password"
              className="w-full bg-white dark:bg-black/30 border border-gray-300 dark:border-gray-600 rounded-lg py-3 pl-10 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-900 dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>

          <button 
            type="submit"
            disabled={isAuthenticating}
            className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all glow relative overflow-hidden group"
          >
            <span className="relative z-10">{isAuthenticating ? 'Authenticating (Catalyst)...' : t('login_button')}</span>
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;

