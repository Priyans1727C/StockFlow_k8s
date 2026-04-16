import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  AlertTriangle,
  BarChart3,
  ScanLine,
  PieChart,
  ShoppingCart,
  PackagePlus,
  X,
  Menu,
  LogOut,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/sales', label: 'POS / Sales', icon: ShoppingCart },
  { path: '/purchases', label: 'Purchases', icon: PackagePlus },
  { path: '/categories', label: 'Categories', icon: FolderTree },
  { path: '/brands', label: 'Brands', icon: Tags },
  { path: '/stock', label: 'Stock Tracking', icon: BarChart3 },
  { path: '/analytics', label: 'Analytics', icon: PieChart },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { path: '/scanner', label: 'Scanner', icon: ScanLine },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

const AppSidebar = ({ open, onClose }: AppSidebarProps) => {
  const location = useLocation();
  const { signOut, profile, user } = useAuth();

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold text-sidebar-active-fg leading-tight">StockFlow</h1>
            <p className="text-[10px] text-sidebar-fg">Inventory Manager</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-sidebar-hover transition-colors">
          <X className="w-5 h-5 text-sidebar-fg" />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <NavLink
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'gradient-primary text-primary-foreground shadow-lg'
                    : 'text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-active-fg'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-3 space-y-2">
        <div className="rounded-xl bg-sidebar-hover p-3">
          <p className="text-[10px] text-sidebar-fg">{profile?.shopName || 'My Shop'}</p>
          <p className="text-xs font-semibold text-sidebar-active-fg truncate">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-sidebar-fg hover:bg-sidebar-hover hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-60 bg-sidebar-bg z-50">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-64 bg-sidebar-bg z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppSidebar;
