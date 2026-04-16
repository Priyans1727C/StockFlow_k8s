-- Helper function (placeholder for future auth)
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT true
$$;

-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT 'bg-gray-100 text-gray-700',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.categories FOR ALL USING (is_owner()) WITH CHECK (is_owner());

-- Brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.brands FOR ALL USING (is_owner()) WITH CHECK (is_owner());

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pc',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.products FOR ALL USING (is_owner()) WITH CHECK (is_owner());

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.sales FOR ALL USING (is_owner()) WITH CHECK (is_owner());

-- Sale items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_sale NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.sale_items FOR ALL USING (is_owner()) WITH CHECK (is_owner());

-- Auto decrement stock on sale item insert
CREATE OR REPLACE FUNCTION public.decrement_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER auto_decrement_stock
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_sale();

-- Purchases table
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  supplier TEXT NOT NULL DEFAULT '',
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.purchases FOR ALL USING (is_owner()) WITH CHECK (is_owner());

-- Purchase items table
CREATE TABLE public.purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  cost_price_at_purchase NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.purchase_items FOR ALL USING (is_owner()) WITH CHECK (is_owner());

-- Auto increment stock on purchase item insert
CREATE OR REPLACE FUNCTION public.increment_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER auto_increment_stock
  AFTER INSERT ON public.purchase_items
  FOR EACH ROW EXECUTE FUNCTION public.increment_stock_on_purchase();

-- Seed categories
INSERT INTO public.categories (name, icon, color) VALUES
  ('Grocery', '🛒', 'bg-green-100 text-green-700'),
  ('Clothing', '👕', 'bg-blue-100 text-blue-700'),
  ('Electronics', '📱', 'bg-purple-100 text-purple-700'),
  ('Footwear', '👟', 'bg-orange-100 text-orange-700'),
  ('Cosmetics', '💄', 'bg-pink-100 text-pink-700'),
  ('Stationery', '📝', 'bg-yellow-100 text-yellow-700'),
  ('Gifts', '🎁', 'bg-red-100 text-red-700'),
  ('Accessories', '⌚', 'bg-teal-100 text-teal-700');

-- Seed brands
INSERT INTO public.brands (name) VALUES
  ('Parle'), ('Britannia'), ('Samsung'), ('Bata'), ('Lakme'), ('Classmate'), ('Levi''s'), ('Nike'), ('Tata');

-- Seed products
INSERT INTO public.products (name, sku, barcode, category_id, brand_id, cost_price, selling_price, stock_quantity, min_stock, unit) VALUES
  ('Parle-G Biscuits', 'GRC-001', '8901234567890', (SELECT id FROM categories WHERE name='Grocery'), (SELECT id FROM brands WHERE name='Parle'), 8, 10, 150, 50, 'pkt'),
  ('Tata Salt 1kg', 'GRC-002', '8901234567891', (SELECT id FROM categories WHERE name='Grocery'), (SELECT id FROM brands WHERE name='Tata'), 24, 28, 40, 30, 'pkt'),
  ('Samsung Galaxy Buds', 'ELC-001', '8901234567892', (SELECT id FROM categories WHERE name='Electronics'), (SELECT id FROM brands WHERE name='Samsung'), 3800, 4999, 5, 10, 'pc'),
  ('Bata Formal Shoes', 'FTW-001', '8901234567893', (SELECT id FROM categories WHERE name='Footwear'), (SELECT id FROM brands WHERE name='Bata'), 900, 1299, 12, 8, 'pair'),
  ('Lakme Eyeliner', 'COS-001', '8901234567894', (SELECT id FROM categories WHERE name='Cosmetics'), (SELECT id FROM brands WHERE name='Lakme'), 180, 250, 0, 15, 'pc'),
  ('Classmate Notebook', 'STN-001', '8901234567895', (SELECT id FROM categories WHERE name='Stationery'), (SELECT id FROM brands WHERE name='Classmate'), 32, 45, 80, 40, 'pc'),
  ('Levi''s Slim Jeans', 'CLT-001', '8901234567896', (SELECT id FROM categories WHERE name='Clothing'), (SELECT id FROM brands WHERE name='Levi''s'), 1800, 2499, 8, 10, 'pc'),
  ('Britannia Good Day', 'GRC-003', '8901234567897', (SELECT id FROM categories WHERE name='Grocery'), (SELECT id FROM brands WHERE name='Britannia'), 24, 30, 3, 25, 'pkt'),
  ('Nike Running Shoes', 'FTW-002', '8901234567898', (SELECT id FROM categories WHERE name='Footwear'), (SELECT id FROM brands WHERE name='Nike'), 4500, 5999, 2, 5, 'pair'),
  ('USB-C Charger Cable', 'ELC-002', '8901234567899', (SELECT id FROM categories WHERE name='Electronics'), (SELECT id FROM brands WHERE name='Samsung'), 250, 499, 25, 20, 'pc'),
  ('Dove Shampoo 200ml', 'COS-002', '8901234567900', (SELECT id FROM categories WHERE name='Cosmetics'), (SELECT id FROM brands WHERE name='Lakme'), 120, 175, 35, 20, 'pc'),
  ('Maggi Noodles Pack', 'GRC-004', '8901234567901', (SELECT id FROM categories WHERE name='Grocery'), (SELECT id FROM brands WHERE name='Parle'), 12, 14, 200, 100, 'pkt'),
  ('Cotton T-Shirt', 'CLT-002', '8901234567902', (SELECT id FROM categories WHERE name='Clothing'), (SELECT id FROM brands WHERE name='Levi''s'), 350, 599, 45, 20, 'pc'),
  ('Wireless Mouse', 'ELC-003', '8901234567903', (SELECT id FROM categories WHERE name='Electronics'), (SELECT id FROM brands WHERE name='Samsung'), 400, 699, 18, 10, 'pc'),
  ('Gift Wrap Set', 'GFT-001', '8901234567904', (SELECT id FROM categories WHERE name='Gifts'), (SELECT id FROM brands WHERE name='Classmate'), 50, 99, 60, 30, 'pc');

-- Seed sample sales
INSERT INTO public.sales (invoice_number, subtotal, discount, total, payment_method) VALUES
  ('INV-20260401-1001', 538, 0, 538, 'cash'),
  ('INV-20260401-1002', 2499, 100, 2399, 'upi'),
  ('INV-20260401-1003', 175, 0, 175, 'card');

-- Seed sale items (triggers will auto-decrement stock)
INSERT INTO public.sale_items (sale_id, product_id, quantity, price_at_sale) VALUES
  ((SELECT id FROM sales WHERE invoice_number='INV-20260401-1001'), (SELECT id FROM products WHERE sku='GRC-001'), 5, 10),
  ((SELECT id FROM sales WHERE invoice_number='INV-20260401-1001'), (SELECT id FROM products WHERE sku='ELC-002'), 1, 499),
  ((SELECT id FROM sales WHERE invoice_number='INV-20260401-1002'), (SELECT id FROM products WHERE sku='CLT-001'), 1, 2499),
  ((SELECT id FROM sales WHERE invoice_number='INV-20260401-1003'), (SELECT id FROM products WHERE sku='COS-002'), 1, 175);

-- Seed sample purchases
INSERT INTO public.purchases (reference_number, supplier, total) VALUES
  ('PO-20260401-2001', 'Parle Distributors', 960),
  ('PO-20260401-2002', 'Samsung India', 7600);

-- Seed purchase items (triggers will auto-increment stock)
INSERT INTO public.purchase_items (purchase_id, product_id, quantity, cost_price_at_purchase) VALUES
  ((SELECT id FROM purchases WHERE reference_number='PO-20260401-2001'), (SELECT id FROM products WHERE sku='GRC-001'), 100, 8),
  ((SELECT id FROM purchases WHERE reference_number='PO-20260401-2001'), (SELECT id FROM products WHERE sku='GRC-003'), 20, 24),
  ((SELECT id FROM purchases WHERE reference_number='PO-20260401-2002'), (SELECT id FROM products WHERE sku='ELC-001'), 2, 3800);