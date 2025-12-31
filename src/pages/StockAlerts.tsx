import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingDown, Package } from 'lucide-react';
import { alertsApi } from '@/services/api';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

const getUrgencyLevel = (quantity: number, threshold: number) => {
  const ratio = quantity / threshold;
  if (quantity === 0) return { label: 'Out of Stock', color: 'bg-destructive text-destructive-foreground', priority: 1 };
  if (ratio <= 0.5) return { label: 'Critical', color: 'bg-destructive text-destructive-foreground', priority: 2 };
  if (ratio <= 1) return { label: 'Low', color: 'bg-warning text-warning-foreground', priority: 3 };
  return { label: 'Normal', color: 'bg-success text-success-foreground', priority: 4 };
};

export default function StockAlertsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await alertsApi.getLowStockProducts();
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch stock alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const outOfStock = products.filter(p => p.quantity === 0);
  const critical = products.filter(p => p.quantity > 0 && p.quantity <= p.low_stock_threshold * 0.5);
  const low = products.filter(p => p.quantity > p.low_stock_threshold * 0.5 && p.quantity <= p.low_stock_threshold);

  return (
    <AppLayout title="Stock Alerts" subtitle="Products that need attention">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-destructive/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                  <p className="mt-1 text-3xl font-bold text-destructive">{outOfStock.length}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical Stock</p>
                  <p className="mt-1 text-3xl font-bold text-destructive">{critical.length}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="mt-1 text-3xl font-bold text-warning">{low.length}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                  <Package className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-success mb-4" />
                <p className="text-lg font-medium text-foreground">All stock levels are healthy!</p>
                <p className="text-sm text-muted-foreground">No products are below their low stock threshold</p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => {
                  const urgency = getUrgencyLevel(product.quantity, product.low_stock_threshold);
                  const stockPercentage = Math.min((product.quantity / product.low_stock_threshold) * 100, 100);
                  
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        'rounded-xl border p-4 transition-all',
                        product.quantity === 0 ? 'border-destructive/50 bg-destructive/5' :
                        urgency.priority === 2 ? 'border-destructive/30 bg-destructive/5' :
                        'border-warning/30 bg-warning/5'
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">
                              {product.brand} {product.model}
                            </h3>
                            <Badge variant="secondary">{product.category}</Badge>
                            <Badge className={urgency.color}>{urgency.label}</Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Current: <span className="font-medium text-foreground">{product.quantity}</span></span>
                            <span>Threshold: <span className="font-medium text-foreground">{product.low_stock_threshold}</span></span>
                            <span>Price: <span className="font-medium text-foreground">{formatCurrency(product.selling_price)}</span></span>
                          </div>
                        </div>
                        <div className="w-full sm:w-32">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                product.quantity === 0 ? 'bg-destructive' :
                                urgency.priority === 2 ? 'bg-destructive' : 'bg-warning'
                              )}
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground text-center">
                            {stockPercentage.toFixed(0)}% of threshold
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
