import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CustomerLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getCart, removeFromCart, updateCartQuantity } from '@/services/api';
import type { CustomerCartItem } from '@/types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function CustomerCartPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CustomerCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCart = async () => {
    const cartItems = await getCart();
    setItems(cartItems);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadCart();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.line_total, 0),
    [items]
  );

  const handleQuantityChange = async (productId: number, nextQuantity: number) => {
    try {
      const updated = await updateCartQuantity(productId, nextQuantity);
      setItems(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update cart.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleRemove = async (productId: number) => {
    const updated = await removeFromCart(productId);
    setItems(updated);
  };

  return (
    <CustomerLayout title="Your Cart" subtitle="Review items before checkout" cartCount={cartCount}>
      <Card>
        <CardHeader>
          <CardTitle>Cart Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="space-y-4 py-8 text-center">
              <p className="text-muted-foreground">Your cart is currently empty.</p>
              <Button asChild className="btn-gradient">
                <Link to="/shop/products">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product_id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {item.product.brand} {item.product.model}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.product.selling_price)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-primary">{formatCurrency(item.line_total)}</p>
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(item.product_id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <Button asChild className="w-full btn-gradient">
                <Link to="/shop/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </CustomerLayout>
  );
}
