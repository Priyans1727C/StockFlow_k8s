import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, ScanLine } from 'lucide-react';

const mobileNavItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/sales', label: 'POS', icon: ShoppingCart },
  { path: '/stock', label: 'Stock', icon: BarChart3 },
  { path: '/scanner', label: 'Scan', icon: ScanLine },
];

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav lg:hidden">
      <div className="flex items-center justify-around py-1.5 px-2">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <item.icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-semibold relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
