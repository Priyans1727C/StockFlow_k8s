import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/context/InventoryContext';
import { Product } from '@/types/inventory';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

const ProductDialog = ({ open, onOpenChange, product }: ProductDialogProps) => {
  const { addProduct, updateProduct, categories, brands } = useInventory();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    price: '',
    costPrice: '',
    quantity: '',
    minStock: '',
    unit: 'pc',
    description: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: product?.name || '',
        sku: product?.sku || '',
        barcode: product?.barcode || '',
        categoryId: (product as any)?._categoryId || '',
        brandId: (product as any)?._brandId || '',
        price: product?.price?.toString() || '',
        costPrice: product?.costPrice?.toString() || '',
        quantity: product?.quantity?.toString() || '',
        minStock: product?.minStock?.toString() || '',
        unit: product?.unit || 'pc',
        description: product?.description || '',
      });
    }
  }, [open, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      name: form.name,
      sku: form.sku,
      barcode: form.barcode,
      category: categories.find(c => c.id === form.categoryId)?.name || '',
      brand: brands.find(b => b.id === form.brandId)?.name || '',
      price: parseFloat(form.price),
      costPrice: parseFloat(form.costPrice),
      quantity: parseInt(form.quantity),
      minStock: parseInt(form.minStock),
      unit: form.unit,
      description: form.description,
      _categoryId: form.categoryId || null,
      _brandId: form.brandId || null,
    };

    if (isEdit && product) {
      updateProduct(product.id, data);
    } else {
      addProduct(data);
    }
    onOpenChange(false);
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{isEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Product Name</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={e => update('sku', e.target.value)} required />
            </div>
            <div>
              <Label>Barcode</Label>
              <Input value={form.barcode} onChange={e => update('barcode', e.target.value)} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={v => update('categoryId', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Brand</Label>
              <Select value={form.brandId} onValueChange={v => update('brandId', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Selling Price (₹)</Label>
              <Input type="number" value={form.price} onChange={e => update('price', e.target.value)} required />
            </div>
            <div>
              <Label>Cost Price (₹)</Label>
              <Input type="number" value={form.costPrice} onChange={e => update('costPrice', e.target.value)} required />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={form.quantity} onChange={e => update('quantity', e.target.value)} required />
            </div>
            <div>
              <Label>Min Stock Level</Label>
              <Input type="number" value={form.minStock} onChange={e => update('minStock', e.target.value)} required />
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={v => update('unit', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['pc', 'pkt', 'kg', 'ltr', 'pair', 'box', 'dozen'].map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="gradient-primary text-primary-foreground border-0">
              {isEdit ? 'Update' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
