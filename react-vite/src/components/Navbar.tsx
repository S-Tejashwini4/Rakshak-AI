import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { Sun, Moon, Menu, LogOut } from 'lucide-react';

const Navbar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { theme, toggleTheme } = useThemeStore();
  const { user, role, logout } = useAuthStore();

  return (
    <header className="glass h-16 flex items-center justify-between px-4 z-10 border-b border-white/10">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="p-2 mr-4 rounded-md hover:bg-white/10 text-gray-400 hover:text-white lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-xl font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
            Command Center
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 dark:hover:text-white rounded-full transition-all"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Profile */}
        <div className="flex items-center pl-4 border-l border-white/10 ml-2">
          <div className="text-right hidden sm:block mr-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-primary font-bold text-right">{role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary font-bold text-sm">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : '??'}
          </div>
          <button onClick={logout} className="ml-3 p-2 text-gray-400 hover:text-danger rounded-full">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
