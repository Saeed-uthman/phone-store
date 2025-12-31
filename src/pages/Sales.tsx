import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Search,
  Check,
  Loader2,
  Receipt,
} from 'lucide-react';
import { productsApi, salesApi } from '@/services/api';
import type { Product, IMEI, SalePayload } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface CartItem {
  product: Product;
  quantity: number;
  imei?: IMEI;
  unitPrice: number;
  totalPrice: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
] as const;

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [isIMEIModalOpen, setIsIMEIModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedProductForIMEI, setSelectedProductForIMEI] = useState<Product | null>(null);
  const [availableIMEIs, setAvailableIMEIs] = useState<IMEI[]>([]);
  const [isLoadingIMEIs, setIsLoadingIMEIs] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsApi.getAll();
        setProducts(response.data.filter(p => p.quantity > 0));
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch products', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      p =>
        p.brand.toLowerCase().includes(query) ||
        p.model.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const handleAddToCart = async (product: Product) => {
    // Check if phone - requires IMEI selection
    if (product.category === 'Phone') {
      setSelectedProductForIMEI(product);
      setIsLoadingIMEIs(true);
      setIsIMEIModalOpen(true);
      
      try {
        const response = await productsApi.getAvailableIMEIs(product.id);
        // Filter out IMEIs already in cart
        const cartIMEIIds = cart.filter(c => c.imei).map(c => c.imei!.id);
        setAvailableIMEIs(response.data.filter(i => !cartIMEIIds.includes(i.id)));
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch IMEIs', variant: 'destructive' });
        setIsIMEIModalOpen(false);
      } finally {
        setIsLoadingIMEIs(false);
      }
      return;
    }

    // Non-phone items - add directly
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast({ title: 'Warning', description: 'Maximum stock reached', variant: 'destructive' });
        return;
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        unitPrice: product.selling_price,
        totalPrice: product.selling_price,
      }]);
    }
  };

  const handleSelectIMEI = (imei: IMEI) => {
    if (!selectedProductForIMEI) return;

    setCart([...cart, {
      product: selectedProductForIMEI,
      quantity: 1,
      imei,
      unitPrice: selectedProductForIMEI.selling_price,
      totalPrice: selectedProductForIMEI.selling_price,
    }]);
    
    setIsIMEIModalOpen(false);
    setSelectedProductForIMEI(null);
    toast({ title: 'Added to cart', description: `IMEI: ${imei.imei_number}` });
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id !== productId) return item;
      
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) return item;
      if (newQuantity > item.product.quantity) {
        toast({ title: 'Warning', description: 'Maximum stock reached', variant: 'destructive' });
        return item;
      }
      
      return {
        ...item,
        quantity: newQuantity,
        totalPrice: newQuantity * item.unitPrice,
      };
    }));
  };

  const handleRemoveFromCart = (productId: number, imeiId?: number) => {
    if (imeiId) {
      setCart(cart.filter(item => item.imei?.id !== imeiId));
    } else {
      setCart(cart.filter(item => item.product.id !== productId || item.imei));
    }
  };

  const handleConfirmSale = async () => {
    if (cart.length === 0) {
      toast({ title: 'Error', description: 'Cart is empty', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      const payload: SalePayload = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          imei_id: item.imei?.id,
          total_price: item.totalPrice,
        })),
        payment_method: paymentMethod,
        total_amount: cartTotal,
      };

      const response = await salesApi.create(payload, user!.id);
      setLastSale(response.data);
      setIsReceiptModalOpen(true);
      setCart([]);
      
      // Refresh products
      const productsResponse = await productsApi.getAll();
      setProducts(productsResponse.data.filter(p => p.quantity > 0));
      
      toast({ title: 'Success', description: 'Sale completed successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to complete sale', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout title="Sales / POS" subtitle="Quick point-of-sale interface">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products by name, brand, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">No products available</p>
                <p className="text-sm text-muted-foreground">Try a different search term</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50"
                  onClick={() => handleAddToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{product.brand}</p>
                        <p className="text-sm text-muted-foreground truncate">{product.model}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 flex-shrink-0">
                        {product.category}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(product.selling_price)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.quantity}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Your cart is empty</p>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div
                        key={`${item.product.id}-${item.imei?.id || index}`}
                        className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {item.product.brand} {item.product.model}
                          </p>
                          {item.imei && (
                            <p className="text-xs text-muted-foreground font-mono">
                              IMEI: {item.imei.imei_number}
                            </p>
                          )}
                          <p className="text-sm text-primary font-medium mt-1">
                            {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!item.imei && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleUpdateQuantity(item.product.id, -1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleUpdateQuantity(item.product.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveFromCart(item.product.id, item.imei?.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <Separator />

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-sm">Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((method) => (
                    <Button
                      key={method.id}
                      variant={paymentMethod === method.id ? 'default' : 'outline'}
                      className={cn(
                        'flex flex-col gap-1 h-auto py-3',
                        paymentMethod === method.id && 'btn-gradient'
                      )}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <method.icon className="h-4 w-4" />
                      <span className="text-xs">{method.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(cartTotal)}</span>
              </div>

              <Button
                className="w-full btn-gradient text-lg py-6"
                onClick={handleConfirmSale}
                disabled={cart.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Confirm Sale
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* IMEI Selection Modal */}
      <Dialog open={isIMEIModalOpen} onOpenChange={setIsIMEIModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select IMEI</DialogTitle>
            <DialogDescription>
              Choose an IMEI for {selectedProductForIMEI?.brand} {selectedProductForIMEI?.model}
            </DialogDescription>
          </DialogHeader>
          {isLoadingIMEIs ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : availableIMEIs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No available IMEIs for this product
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {availableIMEIs.map((imei) => (
                  <Button
                    key={imei.id}
                    variant="outline"
                    className="w-full justify-start font-mono text-sm"
                    onClick={() => handleSelectIMEI(imei)}
                  >
                    {imei.imei_number}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-success" />
              Sale Complete
            </DialogTitle>
            <DialogDescription>
              Sale #{lastSale?.id} has been recorded successfully
            </DialogDescription>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                {lastSale.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.product.brand} {item.product.model}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                    </span>
                    <span className="font-medium">{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(lastSale.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Payment Method</span>
                  <span className="capitalize">{lastSale.payment_method}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsReceiptModalOpen(false)} className="w-full btn-gradient">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
