import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category, Brand, StockAlert, getStockStatus } from '@/types/inventory';
import { Sale, Purchase } from '@/types/sales';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface InventoryContextType {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  alerts: StockAlert[];
  sales: Sale[];
  purchases: Purchase[];
  loading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, 'id' | 'productCount'>) => void;
  deleteCategory: (id: string) => void;
  addBrand: (brand: Omit<Brand, 'id' | 'productCount'>) => void;
  deleteBrand: (id: string) => void;
  addSale: (sale: { items: { productId: string; name: string; sku: string; price: number; quantity: number; unit: string }[]; subtotal: number; discount: number; total: number; paymentMethod: 'cash' | 'upi' | 'card'; invoiceNo: string }) => void;
  addPurchase: (purchase: { items: { productId: string; name: string; sku: string; costPrice: number; quantity: number; unit: string }[]; supplier: string; total: number; referenceNo: string }) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  refreshData: () => void;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, brandRes, prodRes, salesRes, purchaseRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
        supabase.from('products').select('*, categories(name, icon), brands(name)').order('created_at', { ascending: false }),
        supabase.from('sales').select('*, sale_items(*, products(name, sku))').order('created_at', { ascending: false }).limit(50),
        supabase.from('purchases').select('*, purchase_items(*, products(name, sku))').order('created_at', { ascending: false }).limit(50),
      ]);

      if (catRes.data) {
        // Count products per category
        const catCounts: Record<string, number> = {};
        prodRes.data?.forEach((p: any) => { if (p.category_id) catCounts[p.category_id] = (catCounts[p.category_id] || 0) + 1; });
        setCategories(catRes.data.map(c => ({
          id: c.id, name: c.name, icon: c.icon || '📦', color: c.color || 'bg-gray-100 text-gray-700',
          productCount: catCounts[c.id] || 0,
        })));
      }

      if (brandRes.data) {
        const brandCounts: Record<string, number> = {};
        prodRes.data?.forEach((p: any) => { if (p.brand_id) brandCounts[p.brand_id] = (brandCounts[p.brand_id] || 0) + 1; });
        setBrands(brandRes.data.map(b => ({
          id: b.id, name: b.name, productCount: brandCounts[b.id] || 0,
        })));
      }

      if (prodRes.data) {
        setProducts(prodRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode || undefined,
          category: p.categories?.name || '',
          brand: p.brands?.name || '',
          price: Number(p.selling_price),
          costPrice: Number(p.cost_price),
          quantity: p.stock_quantity,
          minStock: p.min_stock,
          unit: p.unit,
          description: p.description || undefined,
          image: p.image_url || undefined,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
          // Keep DB IDs for mutations
          _categoryId: p.category_id,
          _brandId: p.brand_id,
        })));
      }

      if (salesRes.data) {
        setSales(salesRes.data.map((s: any) => ({
          id: s.id,
          invoiceNo: s.invoice_number,
          subtotal: Number(s.subtotal),
          discount: Number(s.discount),
          total: Number(s.total),
          paymentMethod: s.payment_method as 'cash' | 'upi' | 'card',
          timestamp: new Date(s.created_at),
          items: (s.sale_items || []).map((si: any) => ({
            productId: si.product_id,
            name: si.products?.name || '',
            sku: si.products?.sku || '',
            price: Number(si.price_at_sale),
            quantity: si.quantity,
            unit: '',
            maxStock: 0,
          })),
        })));
      }

      if (purchaseRes.data) {
        setPurchases(purchaseRes.data.map((p: any) => ({
          id: p.id,
          referenceNo: p.reference_number,
          supplier: p.supplier,
          total: Number(p.total),
          timestamp: new Date(p.created_at),
          items: (p.purchase_items || []).map((pi: any) => ({
            productId: pi.product_id,
            name: pi.products?.name || '',
            sku: pi.products?.sku || '',
            costPrice: Number(pi.cost_price_at_purchase),
            quantity: pi.quantity,
            unit: '',
          })),
        })));
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const alerts: StockAlert[] = products
    .filter(p => getStockStatus(p.quantity, p.minStock) !== 'in-stock')
    .map(p => ({
      id: p.id, productId: p.id, productName: p.name,
      currentStock: p.quantity, minStock: p.minStock,
      status: getStockStatus(p.quantity, p.minStock), timestamp: new Date(),
    }));

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const { error } = await supabase.from('products').insert({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || null,
      category_id: (product as any)._categoryId || null,
      brand_id: (product as any)._brandId || null,
      selling_price: product.price,
      cost_price: product.costPrice,
      stock_quantity: product.quantity,
      min_stock: product.minStock,
      unit: product.unit,
      description: product.description || null,
      user_id: user.id,
    });
    if (error) { toast.error('Failed to add product'); console.error(error); }
    else { toast.success('Product added'); fetchAll(); }
  }, [fetchAll, user]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode || null;
    if (updates.price !== undefined) dbUpdates.selling_price = updates.price;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.quantity !== undefined) dbUpdates.stock_quantity = updates.quantity;
    if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
    if ((updates as any)._categoryId !== undefined) dbUpdates.category_id = (updates as any)._categoryId;
    if ((updates as any)._brandId !== undefined) dbUpdates.brand_id = (updates as any)._brandId;

    const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
    if (error) { toast.error('Failed to update product'); console.error(error); }
    else { toast.success('Product updated'); fetchAll(); }
  }, [fetchAll]);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error('Failed to delete product'); console.error(error); }
    else { toast.success('Product deleted'); fetchAll(); }
  }, [fetchAll]);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'productCount'>) => {
    if (!user) return;
    const { error } = await supabase.from('categories').insert({ name: category.name, icon: category.icon, color: category.color, user_id: user.id });
    if (error) { toast.error('Failed to add category'); console.error(error); }
    else { toast.success('Category added'); fetchAll(); }
  }, [fetchAll, user]);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { toast.error('Failed to delete category'); console.error(error); }
    else { toast.success('Category deleted'); fetchAll(); }
  }, [fetchAll]);

  const addBrand = useCallback(async (brand: Omit<Brand, 'id' | 'productCount'>) => {
    if (!user) return;
    const { error } = await supabase.from('brands').insert({ name: brand.name, user_id: user.id });
    if (error) { toast.error('Failed to add brand'); console.error(error); }
    else { toast.success('Brand added'); fetchAll(); }
  }, [fetchAll, user]);

  const deleteBrand = useCallback(async (id: string) => {
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) { toast.error('Failed to delete brand'); console.error(error); }
    else { toast.success('Brand deleted'); fetchAll(); }
  }, [fetchAll]);

  const addSale = useCallback(async (sale: { items: { productId: string; name: string; sku: string; price: number; quantity: number; unit: string }[]; subtotal: number; discount: number; total: number; paymentMethod: 'cash' | 'upi' | 'card'; invoiceNo: string }) => {
    if (!user) return;
    const { data: saleData, error: saleError } = await supabase.from('sales').insert({
      invoice_number: sale.invoiceNo,
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      payment_method: sale.paymentMethod,
      user_id: user.id,
    }).select().single();

    if (saleError || !saleData) { toast.error('Failed to create sale'); console.error(saleError); return; }

    // Insert sale items (triggers will auto-decrement stock)
    const { error: itemsError } = await supabase.from('sale_items').insert(
      sale.items.map(item => ({
        sale_id: saleData.id,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_sale: item.price,
      }))
    );

    if (itemsError) { toast.error('Failed to add sale items'); console.error(itemsError); }
    else { fetchAll(); }
  }, [fetchAll, user]);

  const addPurchase = useCallback(async (purchase: { items: { productId: string; name: string; sku: string; costPrice: number; quantity: number; unit: string }[]; supplier: string; total: number; referenceNo: string }) => {
    if (!user) return;
    const { data: purchaseData, error: purchaseError } = await supabase.from('purchases').insert({
      reference_number: purchase.referenceNo,
      supplier: purchase.supplier,
      total: purchase.total,
      user_id: user.id,
    }).select().single();

    if (purchaseError || !purchaseData) { toast.error('Failed to create purchase'); console.error(purchaseError); return; }

    const { error: itemsError } = await supabase.from('purchase_items').insert(
      purchase.items.map(item => ({
        purchase_id: purchaseData.id,
        product_id: item.productId,
        quantity: item.quantity,
        cost_price_at_purchase: item.costPrice,
      }))
    );

    if (itemsError) { toast.error('Failed to add purchase items'); console.error(itemsError); }
    else { fetchAll(); }
  }, [fetchAll, user]);

  return (
    <InventoryContext.Provider value={{
      products, categories, brands, alerts, sales, purchases, loading,
      addProduct, updateProduct, deleteProduct,
      addCategory, deleteCategory, addBrand, deleteBrand,
      addSale, addPurchase,
      searchQuery, setSearchQuery,
      refreshData: fetchAll,
    }}>
      {children}
    </InventoryContext.Provider>
  );
};
