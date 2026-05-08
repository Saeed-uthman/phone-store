import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerLayout } from '@/components/layout';
import { Package } from 'lucide-react';
import { getProducts, getCart } from '@/services/api';
import type { Product } from '@/types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function CustomerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productList, cartItems] = await Promise.all([getProducts(), getCart()]);
        setProducts(productList);
        setCartCount(cartItems.reduce((sum, item) => sum + item.quantity, 0));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <CustomerLayout
      title="Available Products"
      subtitle="Browse available phones and accessories"
      cartCount={cartCount}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Product List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No products are currently available.</p>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {product.brand} {product.model}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary">{product.category}</Badge>
                        <Badge className="bg-success text-success-foreground">In Stock: {product.quantity}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-primary">{formatCurrency(product.selling_price)}</p>
                      <Button asChild className="btn-gradient">
                        <Link to={`/shop/products/${product.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </CustomerLayout>
  );
}
