
-- Products: split ALL into separate policies
DROP POLICY IF EXISTS "Users manage own products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own products write" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own products" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own products" ON public.products FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Categories
DROP POLICY IF EXISTS "Users manage own categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own categories write" ON public.categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own categories" ON public.categories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own categories" ON public.categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Brands
DROP POLICY IF EXISTS "Users manage own brands" ON public.brands;
CREATE POLICY "Anyone can view brands" ON public.brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own brands write" ON public.brands FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own brands" ON public.brands FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own brands" ON public.brands FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Sales
DROP POLICY IF EXISTS "Users manage own sales" ON public.sales;
CREATE POLICY "Anyone can view sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own sales write" ON public.sales FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sales" ON public.sales FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sales" ON public.sales FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Sale Items
DROP POLICY IF EXISTS "Users manage own sale items" ON public.sale_items;
CREATE POLICY "Anyone can view sale items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own sale items write" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = sale_items.sale_id AND purchases.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));
CREATE POLICY "Users delete own sale items" ON public.sale_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));

-- Purchases
DROP POLICY IF EXISTS "Users manage own purchases" ON public.purchases;
CREATE POLICY "Anyone can view purchases" ON public.purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own purchases write" ON public.purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own purchases" ON public.purchases FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own purchases" ON public.purchases FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Purchase Items
DROP POLICY IF EXISTS "Users manage own purchase items" ON public.purchase_items;
CREATE POLICY "Anyone can view purchase items" ON public.purchase_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own purchase items write" ON public.purchase_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.user_id = auth.uid()));
CREATE POLICY "Users delete own purchase items" ON public.purchase_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.user_id = auth.uid()));
