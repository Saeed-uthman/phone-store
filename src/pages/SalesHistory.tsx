import { useState, useEffect, useMemo } from 'react';
import { format, isWithinInterval, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';
import { CalendarIcon, Search, Receipt, Download, Eye, Printer } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { salesApi } from '@/services/api';
import type { Sale } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ReceiptPrintModal } from '@/components/receipt';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type DatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'custom';

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printSale, setPrintSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const response = await salesApi.getAll();
      setSales(response.data);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();

    switch (preset) {
      case 'today':
        setStartDate(startOfDay(today));
        setEndDate(endOfDay(today));
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setStartDate(startOfDay(yesterday));
        setEndDate(endOfDay(yesterday));
        break;
      case 'last7days':
        setStartDate(subWeeks(today, 1));
        setEndDate(today);
        break;
      case 'last30days':
        setStartDate(subDays(today, 30));
        setEndDate(today);
        break;
      case 'thisMonth':
        setStartDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setEndDate(today);
        break;
      case 'custom':
        // Keep current dates for custom
        break;
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Date filter
      if (startDate && endDate) {
        const saleDate = new Date(sale.created_at);
        if (!isWithinInterval(saleDate, { start: startOfDay(startDate), end: endOfDay(endDate) })) {
          return false;
        }
      }

      // Payment method filter
      if (paymentFilter !== 'all' && sale.payment_method !== paymentFilter) {
        return false;
      }

      // Search filter (search in product names, IMEI, or sale ID)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = `#${sale.id}`.includes(query);
        const matchesProduct = sale.items.some(
          (item) =>
            item.product.brand.toLowerCase().includes(query) ||
            item.product.model.toLowerCase().includes(query)
        );
        const matchesImei = sale.items.some(
          (item) => item.imei?.imei_number?.includes(query)
        );
        if (!matchesId && !matchesProduct && !matchesImei) {
          return false;
        }
      }

      return true;
    });
  }, [sales, startDate, endDate, paymentFilter, searchQuery]);

  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  }, [filteredSales]);

  const totalItems = useMemo(() => {
    return filteredSales.reduce(
      (sum, sale) => sum + sale.items.reduce((is, item) => is + item.quantity, 0),
      0
    );
  }, [filteredSales]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentBadgeVariant = (method: string) => {
    switch (method) {
      case 'cash':
        return 'default';
      case 'card':
        return 'secondary';
      case 'transfer':
        return 'outline';
      default:
        return 'default';
    }
  };

  const viewSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const handlePrintReceipt = (sale: Sale) => {
    setPrintSale(sale);
    setIsPrintOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Sales History</h1>
            <p className="text-muted-foreground mt-1">
              View and filter all transaction records
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredSales.length}</div>
              <p className="text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <span className="text-lg">₦</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {/* Search */}
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, product, or IMEI..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date Preset */}
              <div className="w-full md:w-48">
                <label className="text-sm font-medium mb-2 block">Period</label>
                <Select value={datePreset} onValueChange={(v) => handleDatePresetChange(v as DatePreset)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last7days">Last 7 days</SelectItem>
                    <SelectItem value="last30days">Last 30 days</SelectItem>
                    <SelectItem value="thisMonth">This month</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Pickers */}
              {datePreset === 'custom' && (
                <>
                  <div className="w-full md:w-auto">
                    <label className="text-sm font-medium mb-2 block">From</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full md:w-[160px] justify-start text-left font-normal',
                            !startDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PP') : 'Start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="w-full md:w-auto">
                    <label className="text-sm font-medium mb-2 block">To</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full md:w-[160px] justify-start text-left font-normal',
                            !endDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PP') : 'End date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}

              {/* Payment Filter */}
              <div className="w-full md:w-40">
                <label className="text-sm font-medium mb-2 block">Payment</label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All payments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All payments</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No sales found</h3>
                <p className="text-muted-foreground mt-1">
                  Try adjusting your filters or date range
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">#{sale.id.toString().padStart(4, '0')}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(new Date(sale.created_at), 'MMM d, yyyy')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(sale.created_at), 'h:mm a')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {sale.items.map((i) => `${i.product.brand} ${i.product.model}`).join(', ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentBadgeVariant(sale.payment_method)}>
                            {sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(sale.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewSaleDetails(sale)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintReceipt(sale)}
                              title="Print receipt"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Transaction #{selectedSale?.id.toString().padStart(4, '0')}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">
                    {format(new Date(selectedSale.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Time</span>
                  <p className="font-medium">
                    {format(new Date(selectedSale.created_at), 'h:mm a')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Method</span>
                  <p className="font-medium capitalize">{selectedSale.payment_method}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cashier ID</span>
                  <p className="font-medium">#{selectedSale.created_by}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-3">Items</h4>
                <div className="space-y-3">
                  {selectedSale.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.product.brand} {item.product.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unit_price)}
                        </p>
                        {item.imei && (
                          <p className="text-xs text-muted-foreground mt-1">
                            IMEI: {item.imei.imei_number}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(selectedSale.total_amount)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handlePrintReceipt(selectedSale);
                  }}
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Print Modal */}
      <ReceiptPrintModal
        sale={printSale}
        open={isPrintOpen}
        onOpenChange={setIsPrintOpen}
      />
    </AppLayout>
  );
}

// Import Package icon separately to avoid conflict
import { Package } from 'lucide-react';
