import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { productsApi, salesApi } from '@/services/api';
import type { Product, IMEI, SalePayload } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ReceiptPrintModal } from '@/components/receipt';

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
  
  // Selected product and IMEI
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [availableIMEIs, setAvailableIMEIs] = useState<IMEI[]>([]);
  const [selectedIMEI, setSelectedIMEI] = useState<IMEI | null>(null);
  const [isLoadingIMEIs, setIsLoadingIMEIs] = useState(false);
  
  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Receipt
  const [isPrintOpen, setIsPrintOpen] = useState(false);
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

  // Search products
  useEffect(() => {
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
  }, [searchQuery, products]);

  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(`${product.brand} ${product.model}`);
    setShowResults(false);
    setSelectedIMEI(null);
    
    // If phone, fetch IMEIs
    if (product.category === 'Phone') {
      setIsLoadingIMEIs(true);
      try {
        const response = await productsApi.getAvailableIMEIs(product.id);
        setAvailableIMEIs(response.data);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch IMEIs', variant: 'destructive' });
      } finally {
        setIsLoadingIMEIs(false);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setSelectedIMEI(null);
    setSearchQuery('');
    setAvailableIMEIs([]);
  };

  const handleConfirmSale = async () => {
    if (!selectedProduct) {
      toast({ title: 'Error', description: 'Please select a product', variant: 'destructive' });
      return;
    }
    
    if (selectedProduct.category === 'Phone' && !selectedIMEI) {
      toast({ title: 'Error', description: 'Please select an IMEI for the phone', variant: 'destructive' });
      return;
    }
    
    if (!customerName.trim()) {
      toast({ title: 'Error', description: 'Please enter customer name', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      const payload: SalePayload = {
        items: [{
          product_id: selectedProduct.id,
          quantity: 1,
          imei_id: selectedIMEI?.id,
          total_price: selectedProduct.selling_price,
        }],
        payment_method: paymentMethod,
        total_amount: selectedProduct.selling_price,
      };

      const response = await salesApi.create(payload, user!.id);
      
      // Create sale data with customer info for receipt
      setLastSale({
        ...response.data,
        customerName,
        customerPhone,
        items: [{
          product: selectedProduct,
          quantity: 1,
          imei: selectedIMEI,
          unit_price: selectedProduct.selling_price,
          total_price: selectedProduct.selling_price,
        }],
      });
      
      setIsPrintOpen(true);
      
      // Reset form
      handleClearSelection();
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('cash');
      
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

  const isFormValid = selectedProduct && customerName.trim() && 
    (selectedProduct.category !== 'Phone' || selectedIMEI);

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
            {/* Product Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search Product</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by brand, model, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowResults(true)}
                  className="pl-9"
                  disabled={isLoading}
                />
                
                {/* Search Results Dropdown */}
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
                
                {showResults && searchResults.length === 0 && searchQuery && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-4 text-center text-muted-foreground">
                    No products found
                  </div>
                )}
              </div>
            </div>

            {/* Selected Product Details */}
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
                
                {/* IMEI Selection for Phones */}
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
                    {selectedIMEI && (
                      <p className="text-sm text-muted-foreground font-mono">
                        Selected: {selectedIMEI.imei_number}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Customer Information */}
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

            {/* Payment Method */}
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

            {/* Summary */}
            {selectedProduct && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{selectedProduct.brand} {selectedProduct.model}</span>
                </div>
                {selectedIMEI && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IMEI:</span>
                    <span className="font-mono text-xs">{selectedIMEI.imei_number}</span>
                  </div>
                )}
                {customerName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">{customerName}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedProduct.selling_price)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
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
                  Complete Sale & Print Receipt
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Print Modal */}
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
