import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '../../hooks/useAnalytics';
import { ChartDataPoint, AnalyticsFilters } from '../../types/analytics';
import { useTranslation } from 'react-i18next';

interface DashboardChartsProps {
  className?: string;
  filters: AnalyticsFilters;
}

export default function DashboardCharts({ className, filters }: DashboardChartsProps) {
  const { getChartData } = useAnalytics();
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<Record<string, ChartDataPoint[]>>({});

  useEffect(() => {
    loadChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadChartData = async () => {
    try {
      const [salesData, inventoryData, customerData] = await Promise.all([
        getChartData('daily_sales', filters),
        getChartData('total_inventory_value', filters),
        getChartData('total_customers', filters)
      ]);

      setChartData({
        sales: salesData,
        inventory: inventoryData,
        customers: customerData
      });
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  };

  const SimpleLineChart = ({ data, title, color = '#3B82F6' }: { 
    data: ChartDataPoint[]; 
    title: string; 
    color?: string; 
  }) => {
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
          
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * 24 + 10}
              x2="400"
              y2={i * 24 + 10}
              stroke="#e5e7eb"
              strokeWidth="1"
              opacity="0.5"
            />
          ))}
          
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
  };

  const calculateTrend = (data: ChartDataPoint[]) => {
    if (data.length < 2) return { percentage: 0, isPositive: true };
    
    const recent = data.slice(-7).reduce((sum, d) => sum + d.value, 0) / 7;
    const previous = data.slice(-14, -7).reduce((sum, d) => sum + d.value, 0) / 7;
    
    if (previous === 0) return { percentage: 0, isPositive: true };
    
    const percentage = ((recent - previous) / previous) * 100;
    return { percentage: Math.abs(percentage), isPositive: percentage >= 0 };
  };

  const salesTrend = calculateTrend(chartData.sales || []);
  const inventoryTrend = calculateTrend(chartData.inventory || []);
  const customerTrend = calculateTrend(chartData.customers || []);

  return (
    <div className={className}>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 min-w-0">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('dashboard.salesTrend')}
              </span>
              <div className={`flex items-center gap-1 text-sm ${
                salesTrend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {salesTrend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {salesTrend.percentage.toFixed(1)}%
              </div>
            </CardTitle>
            <CardDescription>
              {t('dashboard.dailySalesOverPeriod')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <SimpleLineChart 
              data={chartData.sales || []} 
              title={t('dashboard.sales')} 
              color="#10B981" 
            />
          </CardContent>
        </Card>

        {/* Inventory Value Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                {t('dashboard.inventoryValue')}
              </span>
              <div className={`flex items-center gap-1 text-sm ${
                inventoryTrend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {inventoryTrend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {inventoryTrend.percentage.toFixed(1)}%
              </div>
            </CardTitle>
            <CardDescription>
              {t('dashboard.totalInventoryValueOverTime')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <SimpleLineChart 
              data={chartData.inventory || []} 
              title={t('dashboard.inventory')} 
              color="#3B82F6" 
            />
          </CardContent>
        </Card>

        {/* Customer Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('dashboard.customerGrowth')}
              </span>
              <div className={`flex items-center gap-1 text-sm ${
                customerTrend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {customerTrend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {customerTrend.percentage.toFixed(1)}%
              </div>
            </CardTitle>
            <CardDescription>
              {t('dashboard.totalCustomersOverTime')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <SimpleLineChart 
              data={chartData.customers || []} 
              title={t('dashboard.customers')} 
              color="#8B5CF6" 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}