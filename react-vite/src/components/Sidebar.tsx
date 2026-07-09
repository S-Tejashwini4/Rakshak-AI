import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Bot,
  Search,
  Network,
  Map as MapIcon,
  FileText,
  ChevronLeft,
  ShieldAlert,
  Cpu,
  Clock,
  Activity,
  Settings,
  ScanFace,
  FileDigit,
  BoxSelect,
  QrCode
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../store/authStore';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const { t } = useTranslation();
  const role = useAuthStore((state) => state.role);

  const specializedRoles = ['Cyber Specialist', 'Forensic Analyst', 'Intelligence Officer', 'Evidence Custodian', 'Patrol Officer'];

  const menuItems = [
    { name: t('dashboard'), icon: LayoutDashboard, path: '/dashboard', roles: ['Super Admin', 'Investigator', 'Supervisor', 'Desk Officer', ...specializedRoles] },
    { name: 'CCTV Evidence Pipeline', icon: Cpu, path: '/ai-pipeline', roles: ['Investigator', ...specializedRoles] },
    { name: 'Face Intelligence Engine', icon: ScanFace, path: '/face-intel', roles: ['Investigator', ...specializedRoles] },
    { name: 'Document Intelligence (OCR)', icon: FileDigit, path: '/doc-intel', roles: ['Investigator', ...specializedRoles] },
    { name: 'Evidence Safety Engine', icon: ShieldAlert, path: '/evidence-safety', roles: ['Investigator', ...specializedRoles] },
    { name: 'Visual Intelligence (Objects)', icon: BoxSelect, path: '/object-intel', roles: ['Investigator', ...specializedRoles] },
    { name: 'Barcode Intelligence Engine', icon: QrCode, path: '/barcode-intel', roles: ['Investigator', ...specializedRoles] },
    { name: 'Digital Twin', icon: MapIcon, path: '/digital-twin', roles: ['Super Admin', 'Supervisor', 'Intelligence Officer'] },
    { name: 'Daily Briefing', icon: Activity, path: '/briefing', roles: ['Super Admin', 'Supervisor'] },
    { name: 'Case Timeline Engine', icon: Clock, path: '/timeline', roles: ['Investigator', ...specializedRoles] },
    { name: t('ai_assistant'), icon: Bot, path: '/ai-assistant', roles: ['Investigator', ...specializedRoles] },
    { name: t('crime_search'), icon: Search, path: '/crime-search', roles: ['Investigator', ...specializedRoles] },
    { name: t('network'), icon: Network, path: '/network', roles: ['Investigator', ...specializedRoles] },
    { name: t('reports'), icon: FileText, path: '/reports', roles: ['Super Admin', 'Supervisor', 'Intelligence Officer', 'Forensic Analyst'] },
    { name: 'Live Alerts', icon: ShieldAlert, path: '/alerts', roles: ['Super Admin', 'Investigator', 'Supervisor', ...specializedRoles] },
    { name: 'System Config', icon: Settings, path: '/settings', roles: ['Super Admin'] },
  ];

  const visibleMenuItems = menuItems.filter(item => role && item.roles.includes(role));

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: isOpen ? 256 : 80 }}
      className="glass z-20 flex-shrink-0 relative flex flex-col border-r border-white/10"
    >
      <div className="h-16 flex items-center justify-center border-b border-white/10 relative">
        <img src="/logo.png" alt="Rakshak AI" className="w-8 h-8 rounded object-contain" />
        {isOpen && (
          <span className="ml-3 font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
            RAKSHAK AI
          </span>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-5 bg-white dark:bg-background-dark border border-gray-200 dark:border-white/10 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm"
        >
          <ChevronLeft className={clsx("w-4 h-4 transition-transform", !isOpen && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-3">
          {visibleMenuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => clsx(
                  "flex items-center p-3 rounded-lg transition-all group",
                  isActive
                    ? "bg-primary/20 text-blue-400 glow border border-primary/30"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                )}
                title={!isOpen ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="ml-3 font-medium">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {isOpen && (
        <div className="p-4 border-t border-white/10 text-xs text-gray-500 text-center">
          &copy; 2026 Rakshak AI
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
