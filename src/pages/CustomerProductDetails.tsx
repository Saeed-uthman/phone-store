import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { CustomerLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { addToCart, getCart, getProductById } from '@/services/api';
import type { Product } from '@/types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function CustomerProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [selectedProduct, cartItems] = await Promise.all([
          getProductById(Number(id)),
          getCart(),
        ]);
        setProduct(selectedProduct);
        setCartCount(cartItems.reduce((sum, item) => sum + item.quantity, 0));
      } catch {
        navigate('/shop/products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAdding(true);
    try {
      const updatedCart = await addToCart(product);
      setCartCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));
      toast({
        title: 'Added to cart',
        description: `${product.brand} ${product.model} was added to your cart.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add product to cart.';
      toast({ title: 'Unable to add item', description: message, variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <CustomerLayout title="Product Details" subtitle="Review product information before checkout" cartCount={cartCount}>
      <Button asChild variant="outline">
        <Link to="/shop/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </Button>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : product ? (
            <div className="space-y-5">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl">
                  {product.brand} {product.model}
                </CardTitle>
              </CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{product.category}</Badge>
                {product.quantity > 0 ? (
                  <Badge className="bg-success text-success-foreground">In Stock: {product.quantity}</Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(product.selling_price)}</p>
              </div>
              <Button
                className="w-full btn-gradient"
                onClick={handleAddToCart}
                disabled={product.quantity === 0 || isAdding}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/shop/cart">Go to Cart</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </CustomerLayout>
  );
}
