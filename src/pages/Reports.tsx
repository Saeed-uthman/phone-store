import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  Download,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import { reportsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

const CHART_COLORS = [
  'hsl(234 89% 54%)',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
  'hsl(258 90% 66%)',
  'hsl(199 89% 48%)',
];

export default function ReportsPage() {
  const [salesReport, setSalesReport] = useState<any>(null);
  const [stockReport, setStockReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [sales, stock] = await Promise.all([
          reportsApi.getSalesReport(activePeriod),
          reportsApi.getStockReport(),
        ]);
        setSalesReport(sales.data);
        setStockReport(stock.data);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch reports', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchReports();
  }, [activePeriod]);

  const handleExport = () => {
    const doc = new jsPDF();
    const generatedAt = new Date();
    const dateTag = generatedAt.toISOString().slice(0, 10);

    doc.setFontSize(16);
    doc.text('Phone Store Report', 14, 16);
    doc.setFontSize(11);
    doc.text(`Generated: ${generatedAt.toLocaleString('en-NG')}`, 14, 24);
    doc.text(`Report Type: ${activeTab === 'sales' ? 'Sales' : 'Inventory'}`, 14, 30);
    if (activeTab === 'sales') {
      doc.text(`Period: ${activePeriod}`, 14, 36);
    }

    if (activeTab === 'sales') {
      const salesRows = (salesReport?.top_products || []).map((item: any, index: number) => [
        String(index + 1),
        `${item.product.brand} ${item.product.model}`.trim(),
        String(item.product.category || 'Phone'),
        String(item.quantity || 0),
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Metric', 'Value']],
        body: [
          ['Total Sales', String(salesReport?.total_sales || 0)],
          ['Total Revenue', formatCurrency(salesReport?.total_revenue || 0)],
          ['Items Sold', String(salesReport?.items_sold || 0)],
        ],
      });

      const nextY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 64;
      if (salesRows.length === 0) {
        doc.text('No data available for selected period.', 14, nextY + 12);
      } else {
        autoTable(doc, {
          startY: nextY + 8,
          head: [['Rank', 'Product', 'Category', 'Units Sold']],
          body: salesRows,
        });
      }

      doc.save(`report-sales-${activePeriod}-${dateTag}.pdf`);
      toast({ title: 'Export successful', description: 'Sales report PDF downloaded.' });
      return;
    }

    const categoryRows = (stockReport?.categories || []).map((cat: any) => [
      String(cat.category || 'N/A'),
      String(cat.count || 0),
      formatCurrency(cat.value || 0),
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['Metric', 'Value']],
      body: [
        ['Total Items', String(stockReport?.total_items || 0)],
        ['Inventory Value', formatCurrency(stockReport?.total_value || 0)],
        ['Low Stock Items', String(stockReport?.low_stock_items?.length || 0)],
      ],
    });

    const inventoryY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 58;
    if (categoryRows.length === 0) {
      doc.text('No data available for selected period.', 14, inventoryY + 12);
    } else {
      autoTable(doc, {
        startY: inventoryY + 8,
        head: [['Category', 'Products', 'Value']],
        body: categoryRows,
      });
    }

    const lowStockRows = (stockReport?.low_stock_items || []).map((item: any) => [
      `${item.brand || ''} ${item.model || ''}`.trim(),
      String(item.quantity || 0),
      String(item.low_stock_threshold || 0),
    ]);
    const lowStockY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? (inventoryY + 10);
    if (lowStockRows.length > 0) {
      autoTable(doc, {
        startY: lowStockY + 8,
        head: [['Low Stock Product', 'Current Qty', 'Threshold']],
        body: lowStockRows,
      });
    }

    doc.save(`report-inventory-${dateTag}.pdf`);
    toast({ title: 'Export successful', description: 'Inventory report PDF downloaded.' });
  };

  const categoryChartData = stockReport?.categories?.map((cat: any, index: number) => ({
    name: cat.category,
    value: cat.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const topProductsData = salesReport?.top_products?.map((item: any) => ({
    name: `${item.product.brand} ${item.product.model}`.slice(0, 20),
    quantity: item.quantity,
  })) || [];

  return (
    <AppLayout
      title="Reports"
      subtitle="Sales and inventory analytics"
      actions={
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      }
    >
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'sales' | 'inventory')} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sales">Sales Reports</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
        </TabsList>

        {/* Sales Reports */}
        <TabsContent value="sales" className="space-y-6">
          {/* Period Selector */}
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <Button
                key={period}
                variant={activePeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActivePeriod(period)}
                className={activePeriod === period ? 'btn-gradient' : ''}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                        <p className="mt-1 text-3xl font-bold text-foreground">{salesReport?.total_sales}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">
                          {formatCurrency(salesReport?.total_revenue || 0)}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                        <DollarSign className="h-6 w-6 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
                        <p className="mt-1 text-3xl font-bold text-foreground">{salesReport?.items_sold}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Top Products Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Units Sold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesReport?.top_products?.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline" className="font-bold">
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.product.brand} {item.product.model}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Reports */}
        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                        <p className="mt-1 text-3xl font-bold text-foreground">{stockReport?.total_items}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">
                          {formatCurrency(stockReport?.total_value || 0)}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                        <DollarSign className="h-6 w-6 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                        <p className="mt-1 text-3xl font-bold text-warning">{stockReport?.low_stock_items?.length}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                        <Package className="h-6 w-6 text-warning" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Category Distribution */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {categoryChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Products</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockReport?.categories?.map((cat: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{cat.category}</TableCell>
                          <TableCell className="text-right">{cat.count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(cat.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
