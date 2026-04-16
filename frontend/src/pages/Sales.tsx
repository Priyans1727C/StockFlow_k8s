import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, ScanLine, Search, Plus, Minus, Trash2, CreditCard,
  Banknote, Smartphone, CheckCircle2, X, Receipt
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useInventory } from '@/context/InventoryContext';
import { CartItem, generateInvoiceNo } from '@/types/sales';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Sales = () => {
  const { products, addSale } = useInventory();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastInvoice, setLastInvoice] = useState('');

  // Barcode scanner
  useEffect(() => {
    if (!scanning) return;
    const scanner = new Html5QrcodeScanner('pos-scanner', { fps: 10, qrbox: { width: 200, height: 200 }, aspectRatio: 1, rememberLastUsedCamera: true }, false);
    scanner.render((decodedText) => {
      const product = products.find(p => p.barcode === decodedText || p.sku === decodedText);
      if (product) addToCart(product.id);
      else toast.error('Product not found for scanned code');
      setScanning(false);
      scanner.clear().catch(() => {});
    }, () => {});
    return () => { scanner.clear().catch(() => {}); };
  }, [scanning]);

  const addToCart = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (product.quantity === 0) { toast.error(`${product.name} is out of stock`); return; }

    setCart(prev => {
      const existing = prev.find(c => c.productId === productId);
      if (existing) {
        if (existing.quantity >= product.quantity) { toast.error('Cannot exceed available stock'); return prev; }
        return prev.map(c => c.productId === productId ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, price: product.price, quantity: 1, unit: product.unit, maxStock: product.quantity }];
    });
    toast.success(`${product.name} added`);
  }, [products]);

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.productId !== productId) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0) return c;
      if (newQty > c.maxStock) { toast.error('Cannot exceed stock'); return c; }
      return { ...c, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(c => c.productId !== productId));

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    const invoiceNo = generateInvoiceNo();
    addSale({ items: cart.map(c => ({ productId: c.productId, name: c.name, sku: c.sku, price: c.price, quantity: c.quantity, unit: c.unit })), subtotal, discount, total, paymentMethod, invoiceNo });
    setLastInvoice(invoiceNo);
    setShowSuccess(true);
    setCart([]);
    setDiscount(0);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery))
  );

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Point of Sale
        </h1>
        <p className="text-muted-foreground text-sm">Sell items using barcode scan or search</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Product Search & Scanner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3 space-y-4">
          {/* Scanner + Search Bar */}
          <div className="glass-card p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU or barcode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Button onClick={() => setScanning(!scanning)} variant={scanning ? 'destructive' : 'outline'} className="gap-2 flex-shrink-0">
                <ScanLine className="w-4 h-4" /> {scanning ? 'Stop' : 'Scan'}
              </Button>
            </div>

            <AnimatePresence>
              {scanning && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 overflow-hidden">
                  <div id="pos-scanner" className="w-full max-w-[250px] mx-auto rounded-xl overflow-hidden" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Product Grid */}
          <div className="glass-card p-3 sm:p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Quick Add Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredProducts.slice(0, 12).map(product => (
                <motion.button
                  key={product.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart(product.id)}
                  disabled={product.quantity === 0}
                  className="p-3 rounded-xl border border-border bg-card hover:bg-accent/50 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{product.sku}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-primary">₹{product.price.toLocaleString('en-IN')}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${product.quantity === 0 ? 'bg-destructive/10 text-destructive' : product.quantity <= product.minStock ? 'bg-warning/10 text-warning' : 'bg-green-100 text-green-700'}`}>
                      {product.quantity} {product.unit}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Cart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <div className="glass-card p-3 sm:p-4 sticky top-20">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Cart ({cart.length} items)
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Scan or tap products to add</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                <AnimatePresence>
                  {cart.map(item => (
                    <motion.div key={item.productId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">₹{item.price.toLocaleString('en-IN')} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeFromCart(item.productId)} className="w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors ml-1">
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-foreground w-16 text-right">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Totals */}
            <div className="mt-4 space-y-2 border-t border-border pt-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Discount</span>
                <Input type="number" min={0} value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} placeholder="₹0" className="h-7 text-xs w-20 ml-auto text-right" />
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-2">
                <span>Total</span><span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground mb-2">Payment Method</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'cash' as const, label: 'Cash', icon: Banknote },
                  { key: 'upi' as const, label: 'UPI', icon: Smartphone },
                  { key: 'card' as const, label: 'Card', icon: CreditCard },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setPaymentMethod(m.key)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                      paymentMethod === m.key
                        ? 'border-primary bg-accent text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-accent/50'
                    }`}
                  >
                    <m.icon className="w-4 h-4" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkout Button */}
            <Button onClick={handleCheckout} disabled={cart.length === 0} className="w-full mt-4 gradient-primary text-primary-foreground border-0 gap-2 h-11">
              <CheckCircle2 className="w-4 h-4" /> Checkout — ₹{total.toLocaleString('en-IN')}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-card rounded-2xl p-6 sm:p-8 text-center max-w-sm w-full shadow-xl">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-lg font-bold text-foreground">Sale Complete!</h3>
              <p className="text-sm text-muted-foreground mt-1">Invoice: <span className="font-mono font-semibold">{lastInvoice}</span></p>
              <Button variant="outline" onClick={() => setShowSuccess(false)} className="mt-4 gap-2">
                <X className="w-4 h-4" /> Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sales;
