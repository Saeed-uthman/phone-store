import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CustomerLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getCustomerOrderHistory, getCustomerReceiptByNumber } from '@/services/api';
import type { CustomerOrder } from '@/types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const downloadReceiptPdf = (order: CustomerOrder) => {
  const doc = new jsPDF();
  const paidStatus = order.payment_status === 'paid' ? 'Paid' : 'Pending';

  doc.setFontSize(16);
  doc.text('PhoneStore E-Receipt', 14, 18);
  doc.setFontSize(11);
  doc.text(`Receipt: ${order.receipt_number}`, 14, 28);
  doc.text(`Customer: ${order.customer.full_name}`, 14, 34);
  doc.text(`Phone: ${order.customer.phone_number}`, 14, 40);
  doc.text(`Email: ${order.customer.email}`, 14, 46);
  doc.text(`Date: ${formatDateTime(order.created_at)}`, 14, 52);
  doc.text(`Payment Status: ${paidStatus}`, 14, 58);

  autoTable(doc, {
    startY: 66,
    head: [['Product', 'Qty', 'Unit Price', 'Line Total']],
    body: order.items.map((item) => [
      item.product_name,
      String(item.quantity),
      formatCurrency(item.unit_price),
      formatCurrency(item.line_total),
    ]),
    styles: { fontSize: 10 },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 80;
  doc.text(`Total Amount Paid: ${formatCurrency(order.total_amount)}`, 14, finalY + 10);
  doc.text(
    order.collection_instruction || 'Please come to the shop with this e-receipt to collect your item.',
    14,
    finalY + 18
  );
  doc.save(`receipt-${order.receipt_number}.pdf`);
};

export default function CustomerHistoryPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await getCustomerOrderHistory(1, 50);
        setOrders(response.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load history.';
        toast({ title: 'Load failed', description: message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [toast]);

  const cartCount = 0;
  const totalPaid = useMemo(
    () => orders.filter((order) => order.payment_status === 'paid').reduce((sum, order) => sum + order.total_amount, 0),
    [orders]
  );

  const handleDownload = async (receiptNumber: string) => {
    setIsDownloading(receiptNumber);
    try {
      const receipt = await getCustomerReceiptByNumber(receiptNumber);
      downloadReceiptPdf(receipt);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download receipt.';
      toast({ title: 'Download failed', description: message, variant: 'destructive' });
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <CustomerLayout title="Purchase History" subtitle="View your purchases and download receipts" cartCount={cartCount}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Orders</span>
            <Badge variant="secondary">Total Paid: {formatCurrency(totalPaid)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading history...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No purchases found yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{formatDateTime(order.created_at)}</TableCell>
                    <TableCell className="font-medium">{order.receipt_number}</TableCell>
                    <TableCell>
                      <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/shop/receipt/${order.receipt_number}`}>
                            <FileText className="mr-1 h-4 w-4" />
                            View Receipt
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          className="btn-gradient"
                          onClick={() => handleDownload(order.receipt_number)}
                          disabled={isDownloading === order.receipt_number}
                        >
                          {isDownloading === order.receipt_number ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-1 h-4 w-4" />
                          )}
                          Download PDF
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
    </CustomerLayout>
  );
}
