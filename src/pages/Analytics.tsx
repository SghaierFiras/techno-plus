import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Users, AlertCircle, Activity, ShoppingCart, Wrench, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '../hooks/useAnalytics';
import { formatCurrency } from '@/lib/utils';
import DashboardCharts from '../components/analytics/DashboardCharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ProductAnalytics, SupplierAnalytics, AnalyticsFilters } from '../types/analytics';
import { useTransactions, getEarliestTransactionDate } from '../hooks/useTransactions';
import { useInventory } from '../hooks/useInventory';
import { useTickets } from '../hooks/useTickets';
import { useTranslation } from 'react-i18next';

export default function Analytics() {
  const { t } = useTranslation();
  const { dashboardMetrics, loading, error, refreshData, getEarliestAnalyticsDate } = useAnalytics();
  const { transactions } = useTransactions();
  const { products } = useInventory();
  const { tickets } = useTickets();

  // --- Analytics Filter State ---
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    category: 'all',
    timePeriod: 'daily',
  });
  const [loadingEarliest, setLoadingEarliest] = useState(false);

  useEffect(() => {
    setLoadingEarliest(true);
    getEarliestAnalyticsDate().then(() => {
      setLoadingEarliest(false);
    });
  }, []);

  // Handle 'All Time' selection
  const handleTimePeriodChange = async (value: string) => {
    if (value === 'all_time') {
      setLoadingEarliest(true);
      const [analyticsDate, transactionDate] = await Promise.all([
        getEarliestAnalyticsDate(),
        getEarliestTransactionDate()
      ]);
      let minDate = analyticsDate;
      if (transactionDate && transactionDate < analyticsDate) {
        minDate = transactionDate;
      }
      setFilters(prev => ({
        ...prev,
        timePeriod: 'all_time',
        dateFrom: minDate,
        dateTo: new Date().toISOString().split('T')[0],
      } as AnalyticsFilters));
      setLoadingEarliest(false);
    } else {
      setFilters(prev => ({ ...prev, timePeriod: value as AnalyticsFilters['timePeriod'] }));
    }
  };

  // Build a unified recent activity feed
  const recentEvents = [
    ...transactions.slice(0, 5).map(tx => ({
      type: 'transaction',
      icon: ShoppingCart,
      description: `${t('analytics.saleCompleted')}: #${tx.id}`,
      time: tx.date,
    })),
    ...products.slice(0, 5).map(p => ({
      type: 'product',
      icon: Package,
      description: `${t('analytics.productAdded')}: ${p.name}`,
      time: p.created_at,
    })),
    ...tickets.slice(0, 5).map(tk => ({
      type: 'ticket',
      icon: Wrench,
      description: `${t('analytics.ticketCreated')}: #${tk.id}`,
      time: tk.created_at,
    })),
  ]
    .filter(e => !!e.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  const stats = [
    {
      name: t('dashboard.totalProducts'),
      value: loading ? '—' : dashboardMetrics.totalProducts.toLocaleString(),
      icon: Package,
      description: t('analytics.activeProducts'),
      trend: '+12%',
    },
    {
      name: t('dashboard.lowStock'),
      value: loading ? '—' : dashboardMetrics.lowStockItems.toLocaleString(),
      icon: AlertCircle,
      description: t('analytics.lowStockItems'),
      trend: '-5%',
      isWarning: true,
    },
    {
      name: t('analytics.inventoryValue'),
      value: loading ? '—' : formatCurrency(dashboardMetrics.totalInventoryValue),
      icon: TrendingUp,
      description: t('analytics.totalInventoryWorth'),
      trend: '+8%',
    },
    {
      name: t('dashboard.totalCustomers'),
      value: loading ? '—' : dashboardMetrics.totalCustomers.toLocaleString(),
      icon: Users,
      description: t('analytics.registeredCustomers'),
      trend: '+15%',
    },
  ];

  return (
    <div className="space-y-6 px-4 md:px-8 min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('analytics.title')}</h1>
        <p className="text-muted-foreground">
          {t('analytics.subtitle')}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="bg-card border border-border dark:bg-card/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.isWarning ? 'text-orange-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className={`text-xs mt-1 ${
                  stat.trend.startsWith('+') ? 'text-green-600' : 
                  stat.trend.startsWith('-') ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {stat.trend} {t('analytics.fromLastMonth')}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Error State */}
      {error && (
        <div className="text-red-600 text-sm mt-2">
          {t('dashboard.errorLoadingMetrics')}: {error}
          <button onClick={refreshData} className="ml-2 underline text-blue-600">{t('dashboard.retry')}</button>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.recentActivity')}</CardTitle>
          <CardDescription>{t('analytics.latestSystemActivities')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEvents.length === 0 ? (
              <div className="text-muted-foreground text-sm">{t('analytics.noRecentActivity')}</div>
            ) : (
              recentEvents.map((event, idx) => {
                const Icon = event.icon || Activity;
                return (
                  <div key={idx} className="flex items-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {event.description}
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-xs text-muted-foreground">
                      {formatTimeAgo(event.time)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* --- Analytics Filters UI --- */}
      <Card className="mb-6 bg-card border border-border dark:bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('analytics.filters') || 'Analytics Filters'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('analytics.fromDate') || 'From Date'}</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground dark:bg-background/80"
                disabled={filters.timePeriod === 'all_time'}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('analytics.toDate') || 'To Date'}</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground dark:bg-background/80"
                disabled={filters.timePeriod === 'all_time'}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('analytics.timePeriod') || 'Time Period'}</label>
              <select
                value={filters.timePeriod}
                onChange={e => handleTimePeriodChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground dark:bg-background/80"
                disabled={loadingEarliest}
              >
                <option value="daily">{t('analytics.daily') || 'Daily'}</option>
                <option value="weekly">{t('analytics.weekly') || 'Weekly'}</option>
                <option value="monthly">{t('analytics.monthly') || 'Monthly'}</option>
                <option value="all_time">{t('analytics.allTime') || 'All Time'}</option>
              </select>
            </div>
            <div className="flex items-end">
              {/* This button will trigger chart updates in all tabs */}
              <button
                onClick={() => setFilters({ ...filters })}
                className="w-full px-4 py-2 bg-primary text-black rounded-md"
                disabled={loadingEarliest}
              >
                {loadingEarliest ? t('analytics.loading') || 'Loading...' : t('analytics.updateCharts') || 'Update Charts'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('analytics.overview')}</TabsTrigger>
          <TabsTrigger value="products">{t('analytics.products')}</TabsTrigger>
          <TabsTrigger value="suppliers">{t('analytics.suppliers')}</TabsTrigger>
          <TabsTrigger value="sales">{t('analytics.sales')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DashboardCharts filters={filters} />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductAnalyticsTab filters={filters} />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <SupplierAnalyticsTab filters={filters} />
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <SalesAnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper to format time ago
function formatTimeAgo(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

// --- Product Analytics Tab Implementation ---
function ProductAnalyticsTab({ filters }: { filters: AnalyticsFilters }) {
  const { getProductAnalytics } = useAnalytics();
  const [products, setProducts] = useState<ProductAnalytics[]>([]);

  useEffect(() => {
    getProductAnalytics(filters).then((data) => {
      setProducts(data || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Metrics
  const totalProducts = products.length;
  const lowStock = products.filter(p => p.stock_status === 'low_stock').length;
  const outOfStock = products.filter(p => p.stock_status === 'out_of_stock').length;
  const avgPrice = products.length ? (products.reduce((sum, p) => sum + p.selling_price, 0) / products.length) : 0;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  products.forEach(p => {
    if (!categoryMap[p.category_name]) categoryMap[p.category_name] = 0;
    categoryMap[p.category_name] += 1;
  });
  const categoryData: { name: string; count: number }[] = Object.entries(categoryMap).map(([name, count]) => ({ name, count: count as number }));
  const categoryTotal = categoryData.reduce((sum, c) => sum + c.count, 0);
  const pieColors = ['#3B82F6', '#10B981', '#F59E42', '#EF4444', '#6366F1', '#F472B6', '#FBBF24', '#6EE7B7'];

  // Stock status breakdown
  const stockStatusCounts = {
    in_stock: products.filter(p => p.stock_status === 'in_stock').length,
    low_stock: lowStock,
    out_of_stock: outOfStock,
  };

  // Top products by inventory value
  const topProducts = [...products].sort((a, b) => b.inventory_value - a.inventory_value).slice(0, 5);

  // Pie chart helper
  function PieChart({ data, total, size = 120 }: { data: { name: string; count: number }[]; total: number; size?: number }) {
    let startAngle = 0;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        {data.map((d: { name: string; count: number }, i: number) => {
          const angle = (d.count / total) * 360;
          const x1 = size/2 + (size/2-10) * Math.cos((Math.PI/180)*(startAngle-90));
          const y1 = size/2 + (size/2-10) * Math.sin((Math.PI/180)*(startAngle-90));
          const x2 = size/2 + (size/2-10) * Math.cos((Math.PI/180)*(startAngle+angle-90));
          const y2 = size/2 + (size/2-10) * Math.sin((Math.PI/180)*(startAngle+angle-90));
          const largeArc = angle > 180 ? 1 : 0;
          const path = `M${size/2},${size/2} L${x1},${y1} A${size/2-10},${size/2-10} 0 ${largeArc} 1 ${x2},${y2} Z`;
          const el = <path key={d.name} d={path} fill={pieColors[i%pieColors.length]} />;
          startAngle += angle;
          return el;
        })}
      </svg>
    );
  }

  // Bar chart helper
  function BarChart({ data, labels, colors, height = 80 }: { data: number[]; labels: string[]; colors: string[]; height?: number }) {
    const max = Math.max(...data);
    return (
      <div className="flex items-end gap-2 h-[80px] w-full">
        {data.map((v: number, i: number) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div style={{height: `${(v/max)*height}px`, background: colors[i], width: '24px', borderRadius: '6px'}} />
            <span className="text-xs mt-1">{labels[i]}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active products in inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStock}</div>
            <p className="text-xs text-muted-foreground">Items below minimum stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStock}</div>
            <p className="text-xs text-muted-foreground">Products with zero stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgPrice)}</div>
            <p className="text-xs text-muted-foreground">Average selling price</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Distribution of products by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <PieChart data={categoryData} total={categoryTotal} />
            <div className="flex flex-col gap-2">
              {categoryData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{background: pieColors[i%pieColors.length]}} />
                  <span className="text-sm">{c.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{c.count} ({((c.count as number/categoryTotal)*100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Status Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Status</CardTitle>
          <CardDescription>In stock, low stock, and out of stock products</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart 
            data={[stockStatusCounts.in_stock, stockStatusCounts.low_stock, stockStatusCounts.out_of_stock]} 
            labels={["In Stock", "Low Stock", "Out of Stock"]}
            colors={["#10B981", "#F59E42", "#EF4444"]}
          />
        </CardContent>
      </Card>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Inventory Value</CardTitle>
          <CardDescription>Most valuable products in stock</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Inventory Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.category_name}</TableCell>
                  <TableCell>{p.quantity_in_stock}</TableCell>
                  <TableCell>{formatCurrency(p.selling_price)}</TableCell>
                  <TableCell>{formatCurrency(p.inventory_value)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      p.stock_status === 'in_stock' ? 'default' :
                      p.stock_status === 'low_stock' ? 'secondary' : 'destructive'
                    }>
                      {p.stock_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Supplier Analytics Tab Implementation ---
function SupplierAnalyticsTab({ filters }: { filters: AnalyticsFilters }) {
  const { getSupplierAnalytics } = useAnalytics();
  const [suppliers, setSuppliers] = useState<SupplierAnalytics[]>([]);

  useEffect(() => {
    getSupplierAnalytics(filters).then((data) => {
      setSuppliers(data || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Metrics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.rating > 0).length; // Assume rating > 0 means active
  const avgRating = suppliers.length ? (suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length) : 0;
  const totalInventoryValue = suppliers.reduce((sum, s) => sum + (s.total_inventory_value || 0), 0);

  // Bar chart: Top 5 suppliers by products supplied
  const topByProducts = [...suppliers].sort((a, b) => b.total_products - a.total_products).slice(0, 5);
  const barColors = ['#3B82F6', '#10B981', '#F59E42', '#EF4444', '#6366F1'];

  // Pie chart: Active vs Inactive suppliers
  const activeCount = suppliers.filter(s => s.rating > 0).length;
  const inactiveCount = suppliers.length - activeCount;
  const pieData = [
    { name: 'Active', count: activeCount },
    { name: 'Inactive', count: inactiveCount }
  ];
  const pieColors = ['#10B981', '#EF4444'];

  // Top suppliers by inventory value
  const topByValue = [...suppliers].sort((a, b) => b.total_inventory_value - a.total_inventory_value).slice(0, 5);

  // Pie chart helper (reuse from Products tab)
  function PieChart({ data, total, size = 120 }: { data: { name: string; count: number }[]; total: number; size?: number }) {
    let startAngle = 0;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        {data.map((d: { name: string; count: number }, i: number) => {
          const angle = (d.count / total) * 360;
          const x1 = size/2 + (size/2-10) * Math.cos((Math.PI/180)*(startAngle-90));
          const y1 = size/2 + (size/2-10) * Math.sin((Math.PI/180)*(startAngle-90));
          const x2 = size/2 + (size/2-10) * Math.cos((Math.PI/180)*(startAngle+angle-90));
          const y2 = size/2 + (size/2-10) * Math.sin((Math.PI/180)*(startAngle+angle-90));
          const largeArc = angle > 180 ? 1 : 0;
          const path = `M${size/2},${size/2} L${x1},${y1} A${size/2-10},${size/2-10} 0 ${largeArc} 1 ${x2},${y2} Z`;
          const el = <path key={d.name} d={path} fill={pieColors[i%pieColors.length]} />;
          startAngle += angle;
          return el;
        })}
      </svg>
    );
  }

  // Bar chart helper (reuse from Products tab)
  function BarChart({ data, labels, colors, height = 80 }: { data: number[]; labels: string[]; colors: string[]; height?: number }) {
    const max = Math.max(...data);
    return (
      <div className="flex items-end gap-2 h-[80px] w-full">
        {data.map((v: number, i: number) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div style={{height: `${(v/max)*height}px`, background: colors[i], width: '24px', borderRadius: '6px'}} />
            <span className="text-xs mt-1">{labels[i]}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Registered suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">Suppliers with recent activity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Average supplier rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">Value supplied by all suppliers</p>
          </CardContent>
        </Card>
      </div>

      {/* Products per Supplier Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Suppliers by Products Supplied</CardTitle>
          <CardDescription>Suppliers with the most products</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={topByProducts.map(s => s.total_products)}
            labels={topByProducts.map(s => s.name)}
            colors={barColors}
          />
        </CardContent>
      </Card>

      {/* Supplier Activity Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Activity</CardTitle>
          <CardDescription>Active vs inactive suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <PieChart data={pieData} total={activeCount + inactiveCount} />
            <div className="flex flex-col gap-2">
              {pieData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{background: pieColors[i%pieColors.length]}} />
                  <span className="text-sm">{c.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{c.count} ({((c.count/(activeCount+inactiveCount))*100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Suppliers by Inventory Value</CardTitle>
          <CardDescription>Suppliers providing the most value</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Inventory Value</TableHead>
                <TableHead>Lead Time (days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topByValue.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.total_products}</TableCell>
                  <TableCell>{s.rating}</TableCell>
                  <TableCell>{formatCurrency(s.total_inventory_value)}</TableCell>
                  <TableCell>{s.lead_time_days}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Sales Analytics Tab Implementation ---
function SalesAnalyticsTab() {
  // Fetch all transactions (sales)
  const { transactions } = useTransactions();

  // Metrics
  const totalSales = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const avgOrderValue = totalSales ? totalRevenue / totalSales : 0;

  // Best-selling product (by quantity)
  const productSalesMap: Record<string, { name: string; quantity: number }> = {};
  transactions.forEach(t => {
    (t.items || []).forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.name, quantity: 0 };
      }
      productSalesMap[item.productId].quantity += item.quantity;
    });
  });
  const bestSelling = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity)[0];

  // Sales over time (by date)
  const salesByDateMap: Record<string, number> = {};
  transactions.forEach(t => {
    const date = t.date ? t.date.slice(0, 10) : 'Unknown';
    if (!salesByDateMap[date]) salesByDateMap[date] = 0;
    salesByDateMap[date] += t.totalAmount || 0;
  });
  const salesByDate = Object.entries(salesByDateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  // Top products (by sales quantity)
  const topProducts = Object.entries(productSalesMap)
    .sort(([, a], [, b]) => b.quantity - a.quantity)
    .slice(0, 5)
    .map(([id, data]) => ({ id, ...data }));
  const barColors = ['#3B82F6', '#10B981', '#F59E42', '#EF4444', '#6366F1'];

  // Line chart helper (reuse from DashboardCharts)
  function SimpleLineChart({ data, title, color = '#3B82F6' }: { data: { date: string; value: number }[]; title: string; color?: string }) {
    if (!data || data.length === 0) {
      return (
        <div className="h-32 flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      );
    }
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;
    return (
      <div className="h-32 relative">
        <svg className="w-full h-full" viewBox="0 0 400 120">
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {/* Data line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 380 + 10;
              const y = 100 - ((point.value - minValue) / range) * 80 + 10;
              return `${x},${y}`;
            }).join(' ')}
          />
          {/* Fill area */}
          <polygon
            fill={`url(#gradient-${title})`}
            points={[
              ...data.map((point, index) => {
                const x = (index / (data.length - 1)) * 380 + 10;
                const y = 100 - ((point.value - minValue) / range) * 80 + 10;
                return `${x},${y}`;
              }),
              `${(data.length - 1) / (data.length - 1) * 380 + 10},110`,
              `10,110`
            ].join(' ')}
          />
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 380 + 10;
            const y = 100 - ((point.value - minValue) / range) * 80 + 10;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                className="hover:r-4 transition-all"
              />
            );
          })}
        </svg>
      </div>
    );
  }

  // Bar chart helper (reuse from above)
  function BarChart({ data, labels, colors, height = 80 }: { data: number[]; labels: string[]; colors: string[]; height?: number }) {
    const max = Math.max(...data);
    return (
      <div className="flex items-end gap-2 h-[80px] w-full">
        {data.map((v: number, i: number) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div style={{height: `${(v/max)*height}px`, background: colors[i], width: '24px', borderRadius: '6px'}} />
            <span className="text-xs mt-1">{labels[i]}</span>
          </div>
        ))}
      </div>
    );
  }

  // Recent sales (last 5 transactions)
  const recentSales = [...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">Number of sales transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total revenue from sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Average value per sale</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best-Selling Product</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestSelling ? bestSelling.name : '-'}</div>
            <p className="text-xs text-muted-foreground">Most sold product</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription>Revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleLineChart data={salesByDate} title="sales-trend" color="#10B981" />
        </CardContent>
      </Card>

      {/* Top Products Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Best-selling products by quantity</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={topProducts.map(p => p.quantity)}
            labels={topProducts.map(p => p.name)}
            colors={barColors}
          />
        </CardContent>
      </Card>

      {/* Recent Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Last 5 sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Discount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.date ? new Date(t.date).toLocaleString() : '-'}</TableCell>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{(t.items || []).map(item => item.name).join(', ')}</TableCell>
                  <TableCell>{formatCurrency(t.totalAmount)}</TableCell>
                  <TableCell>{t.paymentMethod || '-'}</TableCell>
                  <TableCell>{t.discount ? (t.discountType === 'percent' ? `${t.discount}%` : `$${t.discount}`) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}