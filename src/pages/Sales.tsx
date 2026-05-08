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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Search,
  Check,
  Loader2,
  User,
  Phone,
  Smartphone,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import { productsApi, salesApi } from '@/services/api';
import type { Product, IMEI, SalePayload } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ReceiptPrintModal } from '@/components/receipt';

type SaleDraftItem = {
  key: string;
  product: Product;
  quantity: number;
  imei?: IMEI;
};

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
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [availableIMEIs, setAvailableIMEIs] = useState<IMEI[]>([]);
  const [selectedIMEI, setSelectedIMEI] = useState<IMEI | null>(null);
  const [isLoadingIMEIs, setIsLoadingIMEIs] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const [saleItems, setSaleItems] = useState<SaleDraftItem[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsApi.getAll();
        setProducts(response.data.filter(p => p.quantity > 0));
      } catch {
        toast({ title: 'Error', description: 'Failed to fetch products', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct && searchQuery.trim() === `${selectedProduct.brand} ${selectedProduct.model}`) {
      setShowResults(false);
      return;
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = products.filter(
      p =>
        p.brand.toLowerCase().includes(query) ||
        p.model.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
    setSearchResults(results);
    setShowResults(true);
  }, [searchQuery, products, selectedProduct]);

  const saleTotal = useMemo(
    () => saleItems.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0),
    [saleItems]
  );

  const getReservedQuantity = (productId: number) => {
    return saleItems
      .filter(item => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const getAvailableStockForSelection = (product: Product) => {
    return Math.max(0, product.quantity - getReservedQuantity(product.id));
  };

  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(`${product.brand} ${product.model}`);
    setShowResults(false);
    setSelectedIMEI(null);
    setSelectedQuantity(1);

    if (product.category === 'Phone') {
      setIsLoadingIMEIs(true);
      try {
        const response = await productsApi.getAvailableIMEIs(product.id);
        const usedIMEIIds = new Set(
          saleItems
            .filter(item => item.product.id === product.id && item.imei)
            .map(item => item.imei!.id)
        );
        setAvailableIMEIs(response.data.filter(imei => !usedIMEIIds.has(imei.id)));
      } catch {
        toast({ title: 'Error', description: 'Failed to fetch IMEIs', variant: 'destructive' });
      } finally {
        setIsLoadingIMEIs(false);
      }
    } else {
      setAvailableIMEIs([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setSelectedIMEI(null);
    setSelectedQuantity(1);
    setSearchQuery('');
    setAvailableIMEIs([]);
  };

  const handleAddItemToSale = () => {
    if (!selectedProduct) {
      toast({ title: 'Error', description: 'Please select a product', variant: 'destructive' });
      return;
    }

    const remainingStock = getAvailableStockForSelection(selectedProduct);
    if (remainingStock <= 0) {
      toast({ title: 'Error', description: 'This product is fully reserved in the current sale', variant: 'destructive' });
      return;
    }

    if (selectedProduct.category === 'Phone') {
      if (!selectedIMEI) {
        toast({ title: 'Error', description: 'Please select an IMEI for the phone', variant: 'destructive' });
        return;
      }

      const alreadyAdded = saleItems.some(item => item.imei?.id === selectedIMEI.id);
      if (alreadyAdded) {
        toast({ title: 'Error', description: 'This IMEI is already added to the sale', variant: 'destructive' });
        return;
      }

      setSaleItems(prev => [
        ...prev,
        {
          key: `${selectedProduct.id}-${selectedIMEI.id}`,
          product: selectedProduct,
          quantity: 1,
          imei: selectedIMEI,
        },
      ]);
      handleClearSelection();
      return;
    }

    if (!Number.isFinite(selectedQuantity) || selectedQuantity < 1) {
      toast({ title: 'Error', description: 'Quantity must be at least 1', variant: 'destructive' });
      return;
    }

    if (selectedQuantity > remainingStock) {
      toast({
        title: 'Error',
        description: `Only ${remainingStock} unit(s) available after current selection`,
        variant: 'destructive',
      });
      return;
    }

    setSaleItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === selectedProduct.id && !item.imei);
      if (existingIndex === -1) {
        return [
          ...prev,
          {
            key: `${selectedProduct.id}-bulk`,
            product: selectedProduct,
            quantity: selectedQuantity,
          },
        ];
      }

      const updated = [...prev];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + selectedQuantity,
      };
      return updated;
    });

    handleClearSelection();
  };

  const handleRemoveItem = (key: string) => {
    setSaleItems(prev => prev.filter(item => item.key !== key));
  };

  const handleChangeItemQuantity = (key: string, nextQuantity: number) => {
    setSaleItems(prev => {
      const target = prev.find(item => item.key === key);
      if (!target) {
        return prev;
      }

      if (target.product.category === 'Phone') {
        return prev;
      }

      if (nextQuantity <= 0) {
        return prev.filter(item => item.key !== key);
      }

      const otherReserved = prev
        .filter(item => item.product.id === target.product.id && item.key !== key)
        .reduce((sum, item) => sum + item.quantity, 0);

      const maxAllowed = Math.max(0, target.product.quantity - otherReserved);
      if (nextQuantity > maxAllowed) {
        toast({
          title: 'Error',
          description: `Maximum allowed quantity for this item is ${maxAllowed}`,
          variant: 'destructive',
        });
        return prev;
      }

      return prev.map(item => (item.key === key ? { ...item, quantity: nextQuantity } : item));
    });
  };

  const handleConfirmSale = async () => {
    if (saleItems.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one product to this sale', variant: 'destructive' });
      return;
    }

    if (!customerName.trim()) {
      toast({ title: 'Error', description: 'Please enter customer name', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      const payload: SalePayload = {
        items: saleItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          imei_id: item.imei?.id,
          total_price: item.product.selling_price * item.quantity,
        })),
        payment_method: paymentMethod,
        total_amount: saleTotal,
      };

      const response = await salesApi.create(payload, user!.id);

      setLastSale({
        ...response.data,
        customerName,
        customerPhone,
        items: saleItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          imei: item.imei,
          unit_price: item.product.selling_price,
          total_price: item.product.selling_price * item.quantity,
        })),
      });

      setIsPrintOpen(true);

      handleClearSelection();
      setSaleItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('cash');

      const productsResponse = await productsApi.getAll();
      setProducts(productsResponse.data.filter(p => p.quantity > 0));

      toast({ title: 'Success', description: 'Sale completed successfully!' });
    } catch {
      toast({ title: 'Error', description: 'Failed to complete sale', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const canAddSelectedItem = selectedProduct
    ? selectedProduct.category === 'Phone'
      ? Boolean(selectedIMEI)
      : selectedQuantity > 0
    : false;

  const isFormValid = saleItems.length > 0 && customerName.trim();

  return (
    <AppLayout title="New Sale" subtitle="Process phone sales">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Phone Sale Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search Product</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by brand, model, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && !selectedProduct && setShowResults(true)}
                  className="pl-9"
                  disabled={isLoading}
                />

                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center justify-between"
                        onClick={() => handleSelectProduct(product)}
                      >
                        <div>
                          <p className="font-medium text-foreground">{product.brand} {product.model}</p>
                          <p className="text-sm text-muted-foreground">{product.category} • Stock: {product.quantity}</p>
                        </div>
                        <span className="font-bold text-primary">{formatCurrency(product.selling_price)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {showResults && searchResults.length === 0 && searchQuery && !selectedProduct && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-4 text-center text-muted-foreground">
                    No products found
                  </div>
                )}
              </div>
            </div>

            {selectedProduct && (
              <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-lg text-foreground">
                      {selectedProduct.brand} {selectedProduct.model}
                    </p>
                    <Badge variant="secondary">{selectedProduct.category}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                    Clear
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Selling Price:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(selectedProduct.selling_price)}
                  </span>
                </div>

                {selectedProduct.category !== 'Phone' && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-medium">Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      max={getAvailableStockForSelection(selectedProduct)}
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(Number(e.target.value) || 1)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Available to add: {getAvailableStockForSelection(selectedProduct)}
                    </p>
                  </div>
                )}

                {selectedProduct.category === 'Phone' && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-medium">Select IMEI *</Label>
                    {isLoadingIMEIs ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading IMEIs...
                      </div>
                    ) : availableIMEIs.length === 0 ? (
                      <p className="text-sm text-destructive">No available IMEIs for this product</p>
                    ) : (
                      <Select
                        value={selectedIMEI?.id.toString() || ''}
                        onValueChange={(value) => {
                          const imei = availableIMEIs.find(i => i.id.toString() === value);
                          setSelectedIMEI(imei || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose IMEI number" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableIMEIs.map((imei) => (
                            <SelectItem key={imei.id} value={imei.id.toString()}>
                              {imei.imei_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleAddItemToSale}
                  disabled={!canAddSelectedItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item to Sale
                </Button>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Sale Items</h3>
              {saleItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items added yet.</p>
              ) : (
                <div className="space-y-3">
                  {saleItems.map((item) => (
                    <div key={item.key} className="rounded-lg border p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-foreground">{item.product.brand} {item.product.model}</p>
                          <p className="text-xs text-muted-foreground">{item.product.category}</p>
                          {item.imei && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">IMEI: {item.imei.imei_number}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {!item.imei && (
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => handleChangeItemQuantity(item.key, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => handleChangeItemQuantity(item.key, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}

                          {item.imei && <span className="text-sm font-medium">Qty: 1</span>}

                          <span className="font-semibold text-primary min-w-[110px] text-right">
                            {formatCurrency(item.product.selling_price * item.quantity)}
                          </span>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.key)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Items Total</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(saleTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="customerPhone"
                      placeholder="Enter phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Payment Method</Label>
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

            <Button
              className="w-full btn-gradient text-lg py-6"
              onClick={handleConfirmSale}
              disabled={!isFormValid || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Complete Multi-Product Sale & Print Receipt
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {lastSale && (
        <ReceiptPrintModal
          open={isPrintOpen}
          onOpenChange={setIsPrintOpen}
          sale={lastSale}
        />
      )}
    </AppLayout>
  );
}
