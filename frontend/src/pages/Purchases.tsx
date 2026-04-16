import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackagePlus, Search, Plus, Minus, Trash2, CheckCircle2, TruckIcon } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { PurchaseItem, generatePurchaseRef } from '@/types/sales';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Purchases = () => {
  const { products, addPurchase, purchases } = useInventory();
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [supplier, setSupplier] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const addItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setItems(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, costPrice: product.costPrice, quantity: 1, unit: product.unit }];
    });
    toast.success(`${product.name} added`);
  };

  const updateQty = (productId: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      return newQty <= 0 ? i : { ...i, quantity: newQty };
    }));
  };

  const removeItem = (productId: string) => setItems(prev => prev.filter(i => i.productId !== productId));

  const total = items.reduce((sum, i) => sum + i.costPrice * i.quantity, 0);

  const handleSubmit = () => {
    if (items.length === 0) { toast.error('Add items first'); return; }
    if (!supplier.trim()) { toast.error('Enter supplier name'); return; }
    const referenceNo = generatePurchaseRef();
    addPurchase({ items: items.map(i => ({ productId: i.productId, name: i.name, sku: i.sku, costPrice: i.costPrice, quantity: i.quantity, unit: i.unit })), supplier: supplier.trim(), total, referenceNo });
    setItems([]);
    setSupplier('');
    toast.success(`Purchase ${referenceNo} recorded. Stock updated!`);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <PackagePlus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Purchase Management
        </h1>
        <p className="text-muted-foreground text-sm">Record purchases to auto-increment stock</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Product Selection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3 space-y-4">
          <div className="glass-card p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products to add..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 text-sm" />
            </div>
          </div>

          <div className="glass-card p-3 sm:p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Select Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredProducts.map(product => (
                <motion.button
                  key={product.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addItem(product.id)}
                  className="p-3 rounded-xl border border-border bg-card hover:bg-accent/50 text-left transition-all"
                >
                  <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{product.sku}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-primary">₹{product.costPrice.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-muted-foreground">{product.quantity} in stock</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recent Purchases */}
          {purchases.length > 0 && (
            <div className="glass-card p-3 sm:p-4">
              <h2 className="text-sm font-semibold text-foreground mb-3">Recent Purchases</h2>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                {purchases.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs font-mono font-semibold text-foreground">{p.referenceNo}</p>
                      <p className="text-[10px] text-muted-foreground">{p.supplier} • {p.items.length} items</p>
                    </div>
                    <span className="text-sm font-bold text-primary">₹{p.total.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Purchase Order */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <div className="glass-card p-3 sm:p-4 sticky top-20">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TruckIcon className="w-4 h-4 text-primary" /> Purchase Order ({items.length} items)
            </h2>

            <Input placeholder="Supplier name" value={supplier} onChange={e => setSupplier(e.target.value)} className="text-sm mb-3" />

            {items.length === 0 ? (
              <div className="text-center py-8">
                <PackagePlus className="w-12 h-12 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Tap products to add to order</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div key={item.productId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">₹{item.costPrice.toLocaleString('en-IN')} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeItem(item.productId)} className="w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors ml-1">
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-foreground w-16 text-right">₹{(item.costPrice * item.quantity).toLocaleString('en-IN')}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className="mt-4 border-t border-border pt-3">
              <div className="flex justify-between text-sm font-bold text-foreground">
                <span>Total</span><span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={items.length === 0} className="w-full mt-4 gradient-primary text-primary-foreground border-0 gap-2 h-11">
              <CheckCircle2 className="w-4 h-4" /> Record Purchase
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Purchases;
