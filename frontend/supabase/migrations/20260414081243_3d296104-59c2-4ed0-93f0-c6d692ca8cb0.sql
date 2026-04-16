
-- Products: only owner can see
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Users view own products" ON public.products FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Categories: only owner can see
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Users view own categories" ON public.categories FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Brands: only owner can see
DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
CREATE POLICY "Users view own brands" ON public.brands FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Sales: only owner can see
DROP POLICY IF EXISTS "Anyone can view sales" ON public.sales;
CREATE POLICY "Users view own sales" ON public.sales FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Purchases: only owner can see
DROP POLICY IF EXISTS "Anyone can view purchases" ON public.purchases;
CREATE POLICY "Users view own purchases" ON public.purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Sale items: only owner of the parent sale can see
DROP POLICY IF EXISTS "Anyone can view sale items" ON public.sale_items;
CREATE POLICY "Users view own sale items" ON public.sale_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid())
);

-- Purchase items: only owner of the parent purchase can see
DROP POLICY IF EXISTS "Anyone can view purchase items" ON public.purchase_items;
CREATE POLICY "Users view own purchase items" ON public.purchase_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.user_id = auth.uid())
);
