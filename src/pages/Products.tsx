import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, Trash2, Package, Loader2 } from 'lucide-react';
import { productsApi } from '@/services/api';
import type { Product, ProductFormData, ProductCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const categories: ProductCategory[] = ['Phone', 'Accessory', 'Charger', 'Cable', 'Case', 'Screen Protector'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

const emptyFormData: ProductFormData = {
  category: 'Phone',
  brand: '',
  model: '',
  quantity: 0,
  cost_price: 0,
  selling_price: 0,
  low_stock_threshold: 3,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.brand.toLowerCase().includes(query) ||
          p.model.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, categoryFilter]);

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll();
      setProducts(response.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch products', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        category: product.category,
        brand: product.brand,
        model: product.model,
        quantity: product.quantity,
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        low_stock_threshold: product.low_stock_threshold,
      });
    } else {
      setSelectedProduct(null);
      setFormData(emptyFormData);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.brand || !formData.model) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (selectedProduct) {
        await productsApi.update(selectedProduct.id, formData);
        toast({ title: 'Success', description: 'Product updated successfully' });
      } else {
        await productsApi.create(formData);
        toast({ title: 'Success', description: 'Product created successfully' });
      }
      await fetchProducts();
      setIsModalOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    setIsSaving(true);
    try {
      await productsApi.delete(selectedProduct.id);
      toast({ title: 'Success', description: 'Product deleted successfully' });
      await fetchProducts();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (product.quantity <= product.low_stock_threshold) {
      return <Badge className="bg-warning text-warning-foreground">Low Stock</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">In Stock</Badge>;
  };

  return (
    <AppLayout
      title="Products"
      subtitle="Manage your phone store inventory"
      actions={
        isAdmin && (
          <Button onClick={() => handleOpenModal()} className="btn-gradient">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )
      }
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Product Inventory
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No products found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="table-row-hover">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{product.brand}</p>
                          <p className="text-sm text-muted-foreground">{product.model}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(product.cost_price)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(product.selling_price)}</TableCell>
                      <TableCell className="text-center">{product.quantity}</TableCell>
                      <TableCell className="text-center">{getStockStatus(product)}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenModal(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Update the product details below.' : 'Fill in the details for the new product.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: ProductCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Brand</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Samsung"
                />
              </div>
              <div className="grid gap-2">
                <Label>Model</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., Galaxy A15"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Cost Price (₦)</Label>
                <Input
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Selling Price (₦)</Label>
                <Input
                  type="number"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="btn-gradient">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProduct?.brand} {selectedProduct?.model}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
