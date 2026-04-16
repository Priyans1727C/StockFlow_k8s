import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, CheckCircle2 } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import StockBadge from '@/components/inventory/StockBadge';

const Alerts = () => {
  const { alerts } = useInventory();

  const sorted = [...alerts].sort((a, b) => {
    const order = { 'out-of-stock': 0, 'critical': 1, 'low-stock': 2, 'in-stock': 3 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" /> Stock Alerts
        </h1>
        <p className="text-muted-foreground text-sm">{alerts.length} active alerts</p>
      </motion.div>

      {sorted.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">All Clear!</h2>
          <p className="text-muted-foreground mt-2">All products are well stocked. No alerts at this time.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {sorted.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-5 flex items-center gap-4 border-l-4 ${
                  alert.status === 'out-of-stock' ? 'border-l-red-500' :
                  alert.status === 'critical' ? 'border-l-orange-500' : 'border-l-yellow-500'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  alert.status === 'out-of-stock' ? 'bg-red-100' :
                  alert.status === 'critical' ? 'bg-orange-100' : 'bg-yellow-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.status === 'out-of-stock' ? 'text-red-600' :
                    alert.status === 'critical' ? 'text-orange-600' : 'text-yellow-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{alert.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    Current: <span className="font-medium">{alert.currentStock}</span> • Min: <span className="font-medium">{alert.minStock}</span>
                  </p>
                </div>
                <StockBadge status={alert.status} animated />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Alerts;
