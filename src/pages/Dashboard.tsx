import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, TrendingUp, DollarSign, ShoppingCart, Users, Truck, Boxes, LayoutGrid, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useAnalytics';
import DashboardCharts from '@/components/analytics/DashboardCharts';

export default function Dashboard() {
  const { t } = useTranslation();
  const { dashboardMetrics, loading, error, refreshData, updateMetrics } = useAnalytics();
  const [updating, setUpdating] = useState(true);

  useEffect(() => {
    // On mount, force update analytics metrics, then refresh dashboard data
    (async () => {
      setUpdating(true);
      await updateMetrics();
      await refreshData();
      setUpdating(false);
    })();
  }, []);

  // Mini-card component for grouped stats
  const MiniStat = ({ icon: Icon, iconBg, label, value }: { icon: React.ElementType, iconBg: string, label: string, value: React.ReactNode }) => (
    <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3">
      <div className={`flex items-center justify-center rounded-full h-9 w-9 ${iconBg}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <div className="text-lg font-semibold leading-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 bg-muted/40 min-w-0 space-y-6">
      {(updating || loading) && (
        <div className="flex justify-center items-center py-12">
          <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
          <span className="text-lg font-medium">{t('common.loading')}</span>
        </div>
      )}
      {!updating && !loading && (
        <>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-1">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
          </div>

          {/* Top Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8 mb-8">
            <Card className="shadow-none border-0 bg-white dark:bg-card/80 min-w-[220px]">
              <CardContent className="p-6 flex flex-col gap-2">
                <MiniStat
                  icon={Package}
                  iconBg="bg-green-500"
                  label={t('dashboard.totalProducts')}
                  value={loading ? t('common.loading') : dashboardMetrics.totalProducts.toLocaleString()}
                />
              </CardContent>
            </Card>
            <Card className="shadow-none border-0 bg-white dark:bg-card/80 min-w-[220px]">
              <CardContent className="p-6 flex flex-col gap-2">
                <MiniStat
                  icon={AlertTriangle}
                  iconBg="bg-orange-500"
                  label={t('dashboard.lowStock')}
                  value={loading ? t('common.loading') : dashboardMetrics.lowStockItems.toLocaleString()}
                />
              </CardContent>
            </Card>
            <Card className="shadow-none border-0 bg-white dark:bg-card/80 min-w-[220px]">
              <CardContent className="p-6 flex flex-col gap-2">
                <MiniStat
                  icon={TrendingUp}
                  iconBg="bg-blue-500"
                  label={t('dashboard.recentSales')}
                  value={loading ? t('common.loading') : dashboardMetrics.dailySales.toLocaleString()}
                />
              </CardContent>
            </Card>
            <Card className="shadow-none border-0 bg-white dark:bg-card/80 min-w-[220px]">
              <CardContent className="p-6 flex flex-col gap-2">
                <MiniStat
                  icon={DollarSign}
                  iconBg="bg-emerald-500"
                  label={t('dashboard.monthlyRevenue')}
                  value={loading ? t('common.loading') : (dashboardMetrics.totalInventoryValue ? `$${dashboardMetrics.totalInventoryValue.toLocaleString()}` : '$0')}
                />
              </CardContent>
            </Card>
          </div>

          {/* Middle Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mb-8">
            {/* Sales Overview */}
            <Card className="bg-white dark:bg-card/80 min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-500" /> {t('dashboard.salesOverview')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MiniStat icon={TrendingUp} iconBg="bg-blue-500" label={t('dashboard.recentSales')} value={loading ? t('common.loading') : dashboardMetrics.dailySales.toLocaleString()} />
                <MiniStat icon={DollarSign} iconBg="bg-emerald-500" label={t('dashboard.monthlyRevenue')} value={loading ? t('common.loading') : (dashboardMetrics.totalInventoryValue ? `$${dashboardMetrics.totalInventoryValue.toLocaleString()}` : '$0')} />
              </CardContent>
            </Card>
            {/* Purchase Overview */}
            <Card className="bg-white dark:bg-card/80 min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-purple-500" /> {t('dashboard.purchaseOverview')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MiniStat icon={ShoppingCart} iconBg="bg-purple-500" label={t('dashboard.totalPurchases')} value={loading ? t('common.loading') : dashboardMetrics.totalPurchases.toLocaleString()} />
                <MiniStat icon={DollarSign} iconBg="bg-blue-400" label={t('dashboard.dailySales')} value={loading ? t('common.loading') : (dashboardMetrics.dailySales ? `$${dashboardMetrics.dailySales.toLocaleString()}` : '$0')} />
              </CardContent>
            </Card>
          </div>

          {/* Lower Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mb-8">
            {/* Inventory Summary */}
            <Card className="bg-white dark:bg-card/80 min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-green-500" /> {t('dashboard.inventorySummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MiniStat icon={Package} iconBg="bg-green-500" label={t('dashboard.quantityInHand')} value={loading ? t('common.loading') : dashboardMetrics.totalProducts.toLocaleString()} />
                <MiniStat icon={DollarSign} iconBg="bg-emerald-500" label={t('dashboard.totalInventoryValue')} value={loading ? t('common.loading') : (dashboardMetrics.totalInventoryValue ? `$${dashboardMetrics.totalInventoryValue.toLocaleString()}` : '$0')} />
              </CardContent>
            </Card>
            {/* Product Details */}
            <Card className="bg-white dark:bg-card/80 min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-orange-500" /> {t('dashboard.productDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MiniStat icon={AlertTriangle} iconBg="bg-orange-500" label={t('dashboard.lowStockItems')} value={loading ? t('common.loading') : dashboardMetrics.lowStockItems.toLocaleString()} />
                <MiniStat icon={Package} iconBg="bg-red-500" label={t('dashboard.outOfStockItems')} value={loading ? t('common.loading') : dashboardMetrics.outOfStockItems.toLocaleString()} />
              </CardContent>
            </Card>
            {/* No. of Users */}
            <Card className="bg-white dark:bg-card/80 min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" /> {t('dashboard.noOfUsers')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MiniStat icon={UserCheck} iconBg="bg-blue-500" label={t('dashboard.totalCustomers')} value={loading ? t('common.loading') : dashboardMetrics.totalCustomers.toLocaleString()} />
                <MiniStat icon={Truck} iconBg="bg-purple-500" label={t('dashboard.totalSuppliers')} value={loading ? t('common.loading') : dashboardMetrics.activeSuppliers.toLocaleString()} />
              </CardContent>
            </Card>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-red-600 text-sm mt-2">
              {t('dashboard.errorLoadingMetrics')}: {error}
              <button onClick={refreshData} className="ml-2 underline text-blue-600">{t('dashboard.retry')}</button>
            </div>
          )}

          {/* Bottom Section: Chart and Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-x-6 gap-y-8 mb-8">
            {/* Sales and Purchase Statistics Chart */}
            <Card className="bg-white dark:bg-card/80 min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" /> {t('dashboard.salesAndPurchaseStatistics')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DashboardCharts filters={{ dateFrom: '', dateTo: '', category: 'all', timePeriod: 'daily' }} />
              </CardContent>
            </Card>
            {/* Recent Activity */}
            <Card className="bg-white dark:bg-card/80 min-w-0">
              <CardHeader>
                <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
                <CardDescription>{t('dashboard.latestSystemActivities')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{t('dashboard.productAdded')}</p>
                      <p className="text-sm text-muted-foreground">{t('dashboard.productAddedDesc')}</p>
                    </div>
                    <div className="ml-auto font-medium text-sm text-muted-foreground">2m {t('dashboard.ago')}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{t('dashboard.saleCompleted')}</p>
                      <p className="text-sm text-muted-foreground">{t('dashboard.transactionExample')}</p>
                    </div>
                    <div className="ml-auto font-medium text-sm text-muted-foreground">5m {t('dashboard.ago')}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{t('dashboard.lowStockAlert')}</p>
                      <p className="text-sm text-muted-foreground">{t('dashboard.lowStockAlertDesc')}</p>
                    </div>
                    <div className="ml-auto font-medium text-sm text-muted-foreground">1h {t('dashboard.ago')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}