import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, IndianRupee, Package, ShoppingCart, ArrowUpRight,
  ArrowDownRight, Calendar, BarChart3, PieChart as PieIcon, Activity, Layers,
  AlertTriangle, Zap, Truck,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/context/InventoryContext';
import { getStockStatus } from '@/types/inventory';
import { format, subDays, startOfDay, isAfter, parseISO } from 'date-fns';

const COLORS = [
  'hsl(25, 95%, 53%)', 'hsl(210, 100%, 52%)', 'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(262, 80%, 50%)',
  'hsl(180, 70%, 45%)', 'hsl(330, 80%, 55%)',
];

const Analytics = () => {
  const { products, sales, purchases, categories } = useInventory();
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  const periodDays = Number(period);
  const cutoff = startOfDay(subDays(new Date(), periodDays));

  // Filter sales/purchases by period
  const filteredSales = useMemo(() =>
    sales.filter(s => isAfter(s.timestamp, cutoff)), [sales, cutoff]);
  const filteredPurchases = useMemo(() =>
    purchases.filter(p => isAfter(p.timestamp, cutoff)), [purchases, cutoff]);

  // ─── KPI Calculations ───
  const totalRevenue = filteredSales.reduce((s, sale) => s + sale.total, 0);
  const totalCOGS = filteredSales.reduce((s, sale) =>
    s + sale.items.reduce((is, item) => {
      const prod = products.find(p => p.id === item.productId);
      return is + (prod?.costPrice || 0) * item.quantity;
    }, 0), 0);
  const grossProfit = totalRevenue - totalCOGS;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const totalPurchaseSpend = filteredPurchases.reduce((s, p) => s + p.total, 0);
  const inventoryValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const inventoryCost = products.reduce((s, p) => s + p.costPrice * p.quantity, 0);
  const avgOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
  const totalItemsSold = filteredSales.reduce((s, sale) =>
    s + sale.items.reduce((is, i) => is + i.quantity, 0), 0);

  // ─── Daily Sales Trend ───
  const dailySales = useMemo(() => {
    const map: Record<string, { revenue: number; orders: number; profit: number }> = {};
    for (let i = 0; i < periodDays; i++) {
      const d = format(subDays(new Date(), periodDays - 1 - i), 'yyyy-MM-dd');
      map[d] = { revenue: 0, orders: 0, profit: 0 };
    }
    filteredSales.forEach(sale => {
      const d = format(sale.timestamp, 'yyyy-MM-dd');
      if (map[d]) {
        map[d].revenue += sale.total;
        map[d].orders += 1;
        map[d].profit += sale.total - sale.items.reduce((s, item) => {
          const prod = products.find(p => p.id === item.productId);
          return s + (prod?.costPrice || 0) * item.quantity;
        }, 0);
      }
    });
    return Object.entries(map).map(([date, data]) => ({
      date: format(new Date(date), periodDays <= 7 ? 'EEE' : 'dd MMM'),
      ...data,
    }));
  }, [filteredSales, periodDays, products]);

  // ─── Payment Methods ───
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { cash: 0, upi: 0, card: 0 };
    filteredSales.forEach(s => { map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.total; });
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({
      name: name.toUpperCase(), value,
    }));
  }, [filteredSales]);

  // ─── Category Performance ───
  const categoryPerformance = useMemo(() => {
    const map: Record<string, { revenue: number; quantity: number; profit: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category || 'Uncategorized';
        if (!map[cat]) map[cat] = { revenue: 0, quantity: 0, profit: 0 };
        map[cat].revenue += item.price * item.quantity;
        map[cat].quantity += item.quantity;
        map[cat].profit += (item.price - (prod?.costPrice || 0)) * item.quantity;
      });
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products]);

  // ─── Top Products ───
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; qty: number; profit: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!map[item.productId]) map[item.productId] = { name: item.name, revenue: 0, qty: 0, profit: 0 };
        const prod = products.find(p => p.id === item.productId);
        map[item.productId].revenue += item.price * item.quantity;
        map[item.productId].qty += item.quantity;
        map[item.productId].profit += (item.price - (prod?.costPrice || 0)) * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filteredSales, products]);

  // ─── Fast/Slow/Dead Stock ───
  const stockAnalysis = useMemo(() => {
    const salesMap: Record<string, number> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        salesMap[item.productId] = (salesMap[item.productId] || 0) + item.quantity;
      });
    });
    const fast: typeof products = [];
    const slow: typeof products = [];
    const dead: typeof products = [];
    products.forEach(p => {
      const sold = salesMap[p.id] || 0;
      if (sold >= 5) fast.push(p);
      else if (sold > 0) slow.push(p);
      else dead.push(p);
    });
    return { fast, slow, dead, salesMap };
  }, [filteredSales, products]);

  // ─── Stock Status Distribution ───
  const stockStatusDist = useMemo(() => {
    const map = { 'In Stock': 0, 'Low Stock': 0, 'Critical': 0, 'Out of Stock': 0 };
    products.forEach(p => {
      const s = getStockStatus(p.quantity, p.minStock);
      if (s === 'in-stock') map['In Stock']++;
      else if (s === 'low-stock') map['Low Stock']++;
      else if (s === 'critical') map['Critical']++;
      else map['Out of Stock']++;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [products]);

  // ─── Profit & Loss ───
  const pnl = useMemo(() => ({
    revenue: totalRevenue,
    cogs: totalCOGS,
    grossProfit,
    purchaseSpend: totalPurchaseSpend,
    netFlow: totalRevenue - totalPurchaseSpend,
    margin: profitMargin,
  }), [totalRevenue, totalCOGS, grossProfit, totalPurchaseSpend, profitMargin]);

  const tooltipStyle = {
    contentStyle: { background: 'hsl(220, 20%, 12%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' },
    labelStyle: { color: 'hsl(220, 10%, 75%)' },
  };

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Analytics & Reports
          </h1>
          <p className="text-muted-foreground text-sm">Comprehensive business insights</p>
        </div>
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Revenue" value={formatCurrency(totalRevenue)} icon={IndianRupee}
          trend={totalRevenue > 0 ? 'up' : 'neutral'} color="text-emerald-600" bg="bg-emerald-50" delay={0} />
        <KPICard title="Gross Profit" value={formatCurrency(grossProfit)} icon={TrendingUp}
          subtitle={`${profitMargin.toFixed(1)}% margin`}
          trend={grossProfit > 0 ? 'up' : 'down'} color="text-blue-600" bg="bg-blue-50" delay={0.05} />
        <KPICard title="Orders" value={filteredSales.length.toString()} icon={ShoppingCart}
          subtitle={`Avg ₹${avgOrderValue.toFixed(0)}`}
          trend="neutral" color="text-orange-600" bg="bg-orange-50" delay={0.1} />
        <KPICard title="Items Sold" value={totalItemsSold.toString()} icon={Package}
          trend="neutral" color="text-purple-600" bg="bg-purple-50" delay={0.15} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50">
          <TabsTrigger value="sales" className="gap-1.5"><Activity className="w-3.5 h-3.5" /> Sales</TabsTrigger>
          <TabsTrigger value="stock" className="gap-1.5"><Layers className="w-3.5 h-3.5" /> Stock</TabsTrigger>
          <TabsTrigger value="pnl" className="gap-1.5"><IndianRupee className="w-3.5 h-3.5" /> P&L</TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5"><Zap className="w-3.5 h-3.5" /> Products</TabsTrigger>
        </TabsList>

        {/* ══════ SALES TAB ══════ */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Trend */}
            <Card className="lg:col-span-2 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Revenue & Profit Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dailySales}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(25, 95%, 53%)" fill="url(#revGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="profit" name="Profit" stroke="hsl(142, 71%, 45%)" fill="url(#profGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Breakdown */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-primary" /> Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {paymentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  {paymentBreakdown.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Orders Bar */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" /> Daily Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="orders" name="Orders" fill="hsl(25, 95%, 53%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Category Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No sales data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" width={100} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(25, 95%, 53%)" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="profit" name="Profit" fill="hsl(142, 71%, 45%)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ STOCK TAB ══════ */}
        <TabsContent value="stock" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Stock Status Distribution */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-primary" /> Stock Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={stockStatusDist} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                      paddingAngle={3} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}>
                      <Cell fill="hsl(142, 71%, 45%)" />
                      <Cell fill="hsl(38, 92%, 50%)" />
                      <Cell fill="hsl(0, 84%, 60%)" />
                      <Cell fill="hsl(220, 10%, 70%)" />
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Inventory Value by Category */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-primary" /> Inventory Value by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const catVal = categories.map(cat => {
                    const catProducts = products.filter(p => p.category === cat.name);
                    return {
                      name: cat.name,
                      value: catProducts.reduce((s, p) => s + p.price * p.quantity, 0),
                    };
                  }).filter(c => c.value > 0);
                  return (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={catVal} cx="50%" cy="50%" outerRadius={90} paddingAngle={3}
                          dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {catVal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Fast / Slow / Dead Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StockTable title="⚡ Fast Moving" subtitle="High demand products"
              items={stockAnalysis.fast} salesMap={stockAnalysis.salesMap} badgeColor="bg-emerald-100 text-emerald-700" />
            <StockTable title="🐢 Slow Moving" subtitle="Low demand products"
              items={stockAnalysis.slow} salesMap={stockAnalysis.salesMap} badgeColor="bg-amber-100 text-amber-700" />
            <StockTable title="💀 Dead Stock" subtitle="No sales in period"
              items={stockAnalysis.dead} salesMap={stockAnalysis.salesMap} badgeColor="bg-red-100 text-red-700" />
          </div>

          {/* Inventory Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniStat label="Total SKUs" value={products.length.toString()} />
            <MiniStat label="Inventory Value (Sell)" value={formatCurrency(inventoryValue)} />
            <MiniStat label="Inventory Cost" value={formatCurrency(inventoryCost)} />
            <MiniStat label="Potential Profit" value={formatCurrency(inventoryValue - inventoryCost)} />
          </div>
        </TabsContent>

        {/* ══════ P&L TAB ══════ */}
        <TabsContent value="pnl" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" /> Profit & Loss Summary
                <Badge variant="outline" className="ml-auto text-xs">Last {period} days</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <PnlRow label="Total Revenue (Sales)" value={pnl.revenue} type="revenue" />
                <PnlRow label="Cost of Goods Sold (COGS)" value={pnl.cogs} type="expense" />
                <div className="border-t border-border pt-3">
                  <PnlRow label="Gross Profit" value={pnl.grossProfit} type={pnl.grossProfit >= 0 ? 'revenue' : 'expense'} bold />
                </div>
                <PnlRow label="Purchase Spend" value={pnl.purchaseSpend} type="expense" />
                <div className="border-t border-border pt-3">
                  <PnlRow label="Net Cash Flow" value={pnl.netFlow} type={pnl.netFlow >= 0 ? 'revenue' : 'expense'} bold />
                </div>
              </div>

              {/* P&L Visual */}
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[
                    { name: 'Revenue', value: pnl.revenue, fill: 'hsl(142, 71%, 45%)' },
                    { name: 'COGS', value: pnl.cogs, fill: 'hsl(0, 84%, 60%)' },
                    { name: 'Gross Profit', value: Math.max(0, pnl.grossProfit), fill: 'hsl(210, 100%, 52%)' },
                    { name: 'Purchases', value: pnl.purchaseSpend, fill: 'hsl(38, 92%, 50%)' },
                    { name: 'Net Flow', value: Math.max(0, pnl.netFlow), fill: 'hsl(25, 95%, 53%)' },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" name="Amount" radius={[8, 8, 0, 0]}>
                      {[
                        'hsl(142, 71%, 45%)', 'hsl(0, 84%, 60%)', 'hsl(210, 100%, 52%)',
                        'hsl(38, 92%, 50%)', 'hsl(25, 95%, 53%)',
                      ].map((color, i) => <Cell key={i} fill={color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Margin Gauge */}
              <div className="flex items-center justify-center gap-6 p-4 rounded-xl bg-muted/50">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Profit Margin</p>
                  <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(avgOrderValue)}</p>
                </div>
                <div className="h-12 w-px bg-border hidden sm:block" />
                <div className="text-center hidden sm:block">
                  <p className="text-xs text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold text-foreground">{filteredSales.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ PRODUCTS TAB ══════ */}
        <TabsContent value="products" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No sales data for this period</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((prod, i) => (
                    <motion.div key={prod.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{prod.name}</p>
                        <p className="text-xs text-muted-foreground">{prod.qty} units sold</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(prod.revenue)}</p>
                        <p className="text-xs text-emerald-600">+{formatCurrency(prod.profit)} profit</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products Bar Chart */}
          {topProducts.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Revenue by Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" width={120} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(25, 95%, 53%)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Sub-components ───

function KPICard({ title, value, icon: Icon, subtitle, trend, color, bg, delay }: {
  title: string; value: string; icon: any; subtitle?: string;
  trend: 'up' | 'down' | 'neutral'; color: string; bg: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div className={`p-2 rounded-xl ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
            {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
            {trend === 'down' && <ArrowDownRight className="w-4 h-4 text-destructive" />}
          </div>
          <p className="text-lg sm:text-xl font-bold text-foreground mt-2">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StockTable({ title, subtitle, items, salesMap, badgeColor }: {
  title: string; subtitle: string; items: any[]; salesMap: Record<string, number>; badgeColor: string;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No products</p>
          ) : items.slice(0, 10).map(p => (
            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
              <span className="font-medium text-foreground truncate flex-1 mr-2">{p.name}</span>
              <Badge className={`${badgeColor} text-[10px] shrink-0`}>
                {salesMap[p.id] || 0} sold
              </Badge>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">{items.length} products</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm sm:text-base font-bold text-foreground mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function PnlRow({ label, value, type, bold }: { label: string; value: number; type: 'revenue' | 'expense'; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-bold text-base' : 'text-sm'}`}>
      <span className="text-foreground">{label}</span>
      <span className={type === 'revenue' ? 'text-emerald-600' : 'text-destructive'}>
        {type === 'expense' ? '- ' : ''}₹{Math.abs(value).toLocaleString('en-IN')}
      </span>
    </div>
  );
}

export default Analytics;
