import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CustomerLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCart, getCustomerReceiptByNumber, getOrderByReceiptNumber } from '@/services/api';
import type { CustomerOrder } from '@/types';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function CustomerReceiptPage() {
  const { receiptNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useCustomerAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!receiptNumber) {
          navigate('/shop/products');
          return;
        }

        const [existingOrder, cartItems] = await Promise.all([
          isAuthenticated ? getCustomerReceiptByNumber(receiptNumber) : getOrderByReceiptNumber(receiptNumber),
          getCart(),
        ]);

        if (!existingOrder) {
          navigate('/shop/products');
          return;
        }

        setOrder(existingOrder);
        setCartCount(cartItems.reduce((sum, item) => sum + item.quantity, 0));
      } catch {
        navigate('/shop/products');
      }
    };

    fetchData();
  }, [isAuthenticated, navigate, receiptNumber]);

  const totalQuantity = useMemo(
    () => order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [order]
  );

  if (!order) {
    return null;
  }

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('PhoneStore E-Receipt', 14, 18);
    doc.setFontSize(11);
    doc.text(`Receipt: ${order.receipt_number}`, 14, 28);
    doc.text(`Customer: ${order.customer.full_name}`, 14, 34);
    doc.text(`Phone: ${order.customer.phone_number}`, 14, 40);
    doc.text(`Email: ${order.customer.email}`, 14, 46);
    doc.text(`Payment Status: Paid`, 14, 52);
    doc.text(`Date: ${new Date(order.created_at).toLocaleString('en-NG')}`, 14, 58);

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
    doc.text('Please come to the shop with this e-receipt to collect your item.', 14, finalY + 18);
    doc.save(`receipt-${order.receipt_number}.pdf`);
  };

  return (
    <CustomerLayout title="Payment Success" subtitle="Your e-receipt is ready for collection" cartCount={cartCount}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            E-Receipt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Receipt Number</p>
              <p className="font-semibold">{order.receipt_number}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <Badge className="bg-success text-success-foreground">Paid</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Customer Name</p>
              <p>{order.customer.full_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p>{order.customer.phone_number}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{order.customer.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Quantity</p>
              <p>{totalQuantity}</p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Products</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={`${item.product_id}-${item.product_name}`} className="flex items-center justify-between text-sm">
                  <span>{item.product_name} x {item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.line_total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Amount Paid</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
            Please come to the shop with this e-receipt to collect your item.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="btn-gradient" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button asChild variant="outline">
              <Link to="/shop/products">Back to Products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </CustomerLayout>
  );
}
