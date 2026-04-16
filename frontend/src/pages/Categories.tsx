import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const emojiOptions = ['🛒', '👕', '📱', '👟', '💄', '📝', '🎁', '⌚', '🍎', '💊', '🏠', '🔧'];
const colorOptions = [
  'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700', 'bg-yellow-100 text-yellow-700',
  'bg-red-100 text-red-700', 'bg-teal-100 text-teal-700',
];

const Categories = () => {
  const { categories, addCategory, deleteCategory } = useInventory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🛒');
  const [color, setColor] = useState(colorOptions[0]);

  const handleAdd = () => {
    if (!name.trim()) return;
    addCategory({ name: name.trim(), icon, color });
    setName('');
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground text-sm">{categories.length} categories</p>
        </motion.div>
        <Button onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground border-0 gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass-card p-5 group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${cat.color}`}>
                  {cat.icon}
                </div>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
              <h3 className="text-base font-semibold text-foreground mt-3">{cat.name}</h3>
              <p className="text-sm text-muted-foreground">{cat.productCount} products</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grocery" />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {emojiOptions.map(e => (
                  <button key={e} onClick={() => setIcon(e)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all ${icon === e ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {colorOptions.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full ${c} border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`} />
                ))}
              </div>
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

export default Categories;
