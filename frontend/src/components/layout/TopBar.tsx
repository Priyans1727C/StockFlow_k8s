import { Search, Bell, Menu } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar = ({ onMenuClick }: TopBarProps) => {
  const { searchQuery, setSearchQuery, alerts } = useInventory();

  return (
    <header className="h-14 sm:h-16 border-b border-border/50 bg-card/80 backdrop-blur-lg sticky top-0 z-40 flex items-center justify-between px-3 sm:px-4 md:px-6 gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors flex-shrink-0 active:scale-95">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary h-9 sm:h-10 text-sm rounded-xl"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="relative p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {alerts.length > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 w-5 h-5 p-0 flex items-center justify-center text-[10px] gradient-primary border-2 border-card text-primary-foreground animate-pulse-glow">
              {alerts.length}
            </Badge>
          )}
        </motion.button>
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-sm shadow-md cursor-pointer"
        >
          S
        </motion.div>
      </div>
    </header>
  );
};

export default TopBar;
