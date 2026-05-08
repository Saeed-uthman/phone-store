import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createOrder, getCart, initializePaystackPayment } from '@/services/api';
import type { CreateOrderData, CustomerCartItem, CustomerInfo } from '@/types';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

const defaultCustomerInfo: CustomerInfo = {
  full_name: '',
  phone_number: '',
  email: '',
};

export default function CustomerCheckoutPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerInfo>(defaultCustomerInfo);
  const [cartItems, setCartItems] = useState<CustomerCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const { user: customerUser } = useCustomerAuth();

  useEffect(() => {
    const loadCart = async () => {
      try {
        const items = await getCart();
        if (items.length === 0) {
          navigate('/shop/cart');
          return;
        }
        setCartItems(items);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [navigate]);

  useEffect(() => {
    if (!customerUser) {
      return;
    }

    setCustomer({
      full_name: customerUser.full_name || '',
      phone_number: customerUser.phone || '',
      email: customerUser.email || '',
    });
  }, [customerUser]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.line_total, 0),
    [cartItems]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customer.full_name.trim() || !customer.phone_number.trim() || !customer.email.trim()) {
      toast({ title: 'Missing details', description: 'Please fill in all customer details.', variant: 'destructive' });
      return;
    }

    setIsPaying(true);
    try {
      const orderData: CreateOrderData = {
        customer,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          product_name: `${item.product.brand} ${item.product.model}`,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
          line_total: item.line_total,
        })),
        total_amount: totalAmount,
        customer_account_id: customerUser?.id,
      };

      const order = await createOrder(orderData);
      const paymentResult = await initializePaystackPayment(order);

      navigate(`/shop/receipt/${paymentResult.receipt_number}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment could not be completed.';
      toast({ title: 'Checkout failed', description: message, variant: 'destructive' });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <CustomerLayout title="Checkout" subtitle="Enter your details and complete payment" cartCount={cartCount}>
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={customer.full_name}
                onChange={(event) => setCustomer({ ...customer, full_name: event.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={customer.phone_number}
                onChange={(event) => setCustomer({ ...customer, phone_number: event.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customer.email}
                onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
                placeholder="Enter email address"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                {cartItems.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span>
                      {item.product.brand} {item.product.model} x {item.quantity}
                    </span>
                    <span>{formatCurrency(item.line_total)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                </div>
                <Button type="submit" className="w-full btn-gradient" disabled={isPaying}>
                  {isPaying ? 'Processing...' : 'Pay with Paystack'}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/shop/cart">Back to Cart</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </form>
    </CustomerLayout>
  );
}
