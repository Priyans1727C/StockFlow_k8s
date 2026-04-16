import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingUp, IndianRupee, ShoppingCart, ArrowDown, TrendingDown, Sparkles } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { getStockStatus } from '@/types/inventory';
import StatCard from '@/components/inventory/StatCard';
import StockBadge from '@/components/inventory/StockBadge';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20 } }
};

const Dashboard = () => {
  const { products, categories, alerts, sales } = useInventory();

  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => {
    const s = getStockStatus(p.quantity, p.minStock);
    return s === 'low-stock' || s === 'critical';
  }).length;
  const outOfStock = products.filter(p => p.quantity === 0).length;
  const recentAlerts = alerts.slice(0, 5);

  const todaySales = sales.filter(s => {
    const d = new Date(s.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 sm:space-y-6">
      {/* Greeting */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            Dashboard <Sparkles className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-muted-foreground text-sm">Overview of your inventory</p>
        </div>
        {todayRevenue > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-green-50 border border-green-200"
          >
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-700">₹{todayRevenue.toLocaleString('en-IN')} today</span>
          </motion.div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Products" value={totalProducts} icon={Package} color="bg-blue-100 text-blue-600" delay={0} />
        <StatCard title="Inventory" value={`₹${totalValue.toLocaleString('en-IN')}`} icon={IndianRupee} color="bg-emerald-100 text-emerald-600" delay={0.08} />
        <StatCard title="Low Stock" value={lowStockCount} icon={TrendingDown} color="bg-amber-100 text-amber-600" delay={0.16} subtitle="Need restocking" />
        <StatCard title="Out of Stock" value={outOfStock} icon={AlertTriangle} color="bg-red-100 text-red-600" delay={0.24} subtitle="Urgent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Stock Alerts */}
        <motion.div variants={item} className="glass-card p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            Stock Alerts
            {recentAlerts.length > 0 && (
              <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {recentAlerts.length}
              </span>
            )}
          </h2>
          {recentAlerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-muted-foreground text-sm font-medium">All stock levels healthy!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAlerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{alert.productName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="h-1.5 w-16 sm:w-24 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((alert.currentStock / alert.minStock) * 100, 100)}%` }}
                          transition={{ delay: 0.5 + i * 0.05, duration: 0.6 }}
                          className={`h-full rounded-full ${alert.currentStock === 0 ? 'bg-red-500' : alert.currentStock < alert.minStock * 0.5 ? 'bg-amber-500' : 'bg-amber-400'}`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{alert.currentStock}/{alert.minStock}</p>
                    </div>
                  </div>
                  <StockBadge status={alert.status} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Categories */}
        <motion.div variants={item} className="glass-card p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary" />
            </div>
            Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {categories.slice(0, 6).map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05, type: 'spring', damping: 20 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`p-3 sm:p-4 rounded-2xl border cursor-pointer transition-shadow hover:shadow-md ${cat.color}`}
              >
                <span className="text-2xl sm:text-3xl block">{cat.icon}</span>
                <p className="text-xs sm:text-sm font-bold mt-1.5 truncate">{cat.name}</p>
                <p className="text-[10px] sm:text-xs opacity-60 font-medium">{cat.productCount} items</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Restock Table */}
      <motion.div variants={item} className="glass-card p-4 sm:p-6">
        <h2 className="text-sm sm:text-base font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
            <ArrowDown className="w-4 h-4 text-red-600" />
          </div>
          Products Needing Restock
        </h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 px-4 sm:px-2 font-semibold uppercase tracking-wider">Product</th>
                <th className="pb-3 font-semibold uppercase tracking-wider hidden sm:table-cell">SKU</th>
                <th className="pb-3 font-semibold uppercase tracking-wider">Stock</th>
                <th className="pb-3 font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {products
                .filter(p => getStockStatus(p.quantity, p.minStock) !== 'in-stock')
                .sort((a, b) => a.quantity - b.quantity)
                .map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 sm:px-2 text-sm font-semibold text-foreground">{product.name}</td>
                    <td className="py-3 text-sm text-muted-foreground font-mono hidden sm:table-cell">{product.sku}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{product.quantity}</span>
                        <span className="text-xs text-muted-foreground">{product.unit}</span>
                      </div>
                    </td>
                    <td className="py-3"><StockBadge status={getStockStatus(product.quantity, product.minStock)} /></td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
