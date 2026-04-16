import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Package, TrendingDown, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { getStockStatus, StockStatus } from '@/types/inventory';
import StockBadge from '@/components/inventory/StockBadge';

const StockTracking = () => {
  const { products } = useInventory();

  const stockBreakdown = useMemo(() => {
    const counts: Record<StockStatus, number> = { 'in-stock': 0, 'low-stock': 0, 'critical': 0, 'out-of-stock': 0 };
    products.forEach(p => counts[getStockStatus(p.quantity, p.minStock)]++);
    return counts;
  }, [products]);

  const sorted = useMemo(() =>
    [...products].sort((a, b) => {
      const order: Record<StockStatus, number> = { 'out-of-stock': 0, 'critical': 1, 'low-stock': 2, 'in-stock': 3 };
      return order[getStockStatus(a.quantity, a.minStock)] - order[getStockStatus(b.quantity, b.minStock)];
    }), [products]);

  const total = products.length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Stock Tracking</h1>
        <p className="text-muted-foreground text-sm">Real-time stock monitoring</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'In Stock', count: stockBreakdown['in-stock'], icon: CheckCircle2, cls: 'stock-high' },
          { label: 'Low Stock', count: stockBreakdown['low-stock'], icon: TrendingDown, cls: 'stock-medium' },
          { label: 'Critical', count: stockBreakdown['critical'], icon: AlertOctagon, cls: 'stock-low' },
          { label: 'Out of Stock', count: stockBreakdown['out-of-stock'], icon: Package, cls: 'stock-out' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`rounded-xl p-3 sm:p-5 border ${item.cls}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <item.icon className="w-6 h-6 sm:w-8 sm:h-8 opacity-70 flex-shrink-0" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">{item.count}</p>
                <p className="text-xs sm:text-sm font-medium">{item.label}</p>
              </div>
            </div>
            <div className="mt-2 sm:mt-3 h-1.5 sm:h-2 rounded-full bg-black/10 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${total ? (item.count / total) * 100 : 0}%` }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }} className="h-full rounded-full bg-current opacity-50" />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Stock Levels
        </h2>
        <div className="space-y-2 sm:space-y-3">
          {sorted.map((product, i) => {
            const status = getStockStatus(product.quantity, product.minStock);
            const fillPercent = product.minStock > 0 ? Math.min((product.quantity / (product.minStock * 2)) * 100, 100) : 100;
            const barColor = status === 'in-stock' ? 'bg-green-500' : status === 'low-stock' ? 'bg-yellow-500' : status === 'critical' ? 'bg-orange-500' : 'bg-red-500';

            return (
              <motion.div key={product.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.03 }}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 p-2.5 sm:p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="sm:w-48 sm:min-w-[12rem]">
                  <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-1">
                  <div className="flex-1 h-2.5 sm:h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${fillPercent}%` }}
                      transition={{ delay: 0.6 + i * 0.03, duration: 0.5 }} className={`h-full rounded-full ${barColor}`} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">{product.quantity}/{product.minStock * 2}</span>
                  <StockBadge status={status} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default StockTracking;
