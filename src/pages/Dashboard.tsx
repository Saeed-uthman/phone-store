import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, AlertTriangle, ShoppingCart, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { dashboardApi } from '@/services/api';
import type { DashboardStats, Activity } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const activityIcons = {
  sale: ShoppingCart,
  stock_update: Package,
  low_stock: AlertTriangle,
  new_product: Package,
};

const activityColors = {
  sale: 'text-success',
  stock_update: 'text-primary',
  low_stock: 'text-warning',
  new_product: 'text-primary',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentActivity(),
        ]);
        setStats(statsRes.data);
        setActivities(activityRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = stats?.weekly_sales.map((value, index) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
    sales: value,
  })) || [];

  return (
    <AppLayout title="Dashboard" subtitle="Welcome back! Here's an overview of your store.">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="stat-card stat-card-primary overflow-hidden">
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                      <p className="mt-1 text-3xl font-bold text-foreground">{stats?.total_products}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card stat-card-warning overflow-hidden">
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                      <p className="mt-1 text-3xl font-bold text-foreground">{stats?.low_stock_count}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                      <AlertTriangle className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card stat-card-success overflow-hidden">
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
                      <p className="mt-1 text-3xl font-bold text-foreground">{stats?.today_sales}</p>
                      <p className="mt-1 text-sm text-success">{formatCurrency(stats?.today_revenue || 0)}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                      <ShoppingCart className="h-6 w-6 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card stat-card-primary overflow-hidden">
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {formatCurrency(stats?.inventory_value || 0)}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sales Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Weekly Sales Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#salesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {activities.map((activity) => {
                    const Icon = activityIcons[activity.type];
                    return (
                      <div key={activity.id} className="flex items-start gap-3 animate-fade-in">
                        <div className={cn(
                          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted',
                          activityColors[activity.type]
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-2">{activity.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
