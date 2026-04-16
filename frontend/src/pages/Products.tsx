import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { getStockStatus } from '@/types/inventory';
import StockBadge from '@/components/inventory/StockBadge';
import ProductDialog from '@/components/inventory/ProductDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/types/inventory';

const Products = () => {
  const { products, deleteProduct, searchQuery, categories } = useInventory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, categoryFilter]);

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditProduct(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} products</p>
        </motion.div>
        <Button onClick={handleAdd} className="gradient-primary text-primary-foreground border-0 gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.icon} {c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        <AnimatePresence>
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                </div>
                <StockBadge status={getStockStatus(product.quantity, product.minStock)} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Price</p>
                  <p className="text-sm font-medium text-foreground">₹{product.price.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Stock</p>
                  <p className="text-sm font-semibold text-foreground">{product.quantity} {product.unit}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Brand</p>
                  <p className="text-sm text-foreground truncate">{product.brand}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                <button onClick={() => handleEdit(product)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => deleteProduct(product.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-destructive/10 text-destructive text-sm transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop Table View */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-muted-foreground bg-muted/30">
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">SKU</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Brand</th>
                <th className="p-4 font-medium">Price (₹)</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4">
                      <p className="text-sm font-semibold text-foreground">{product.name}</p>
                      {product.barcode && <p className="text-xs text-muted-foreground font-mono">{product.barcode}</p>}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground font-mono">{product.sku}</td>
                    <td className="p-4 text-sm text-muted-foreground">{product.category}</td>
                    <td className="p-4 text-sm text-muted-foreground">{product.brand}</td>
                    <td className="p-4 text-sm font-medium text-foreground">₹{product.price.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-sm font-semibold text-foreground">{product.quantity} {product.unit}</td>
                    <td className="p-4"><StockBadge status={getStockStatus(product.quantity, product.minStock)} /></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(product)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} product={editProduct} />
    </div>
  );
};

export default Products;
