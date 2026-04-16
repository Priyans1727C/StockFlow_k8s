import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Tags } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Brands = () => {
  const { brands, addBrand, deleteBrand } = useInventory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addBrand({ name: name.trim() });
    setName('');
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Brands</h1>
          <p className="text-muted-foreground text-sm">{brands.length} brands</p>
        </motion.div>
        <Button onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground border-0 gap-2">
          <Plus className="w-4 h-4" /> Add Brand
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {brands.map((brand, i) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass-card p-5 group"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Tags className="w-6 h-6 text-accent-foreground" />
                </div>
                <button
                  onClick={() => deleteBrand(brand.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
              <h3 className="text-base font-semibold text-foreground mt-3">{brand.name}</h3>
              <p className="text-sm text-muted-foreground">{brand.productCount} products</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Brand</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Brand Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Parle" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} className="gradient-primary text-primary-foreground border-0">Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Brands;
