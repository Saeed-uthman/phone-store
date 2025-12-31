import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import { suppliersApi } from '@/services/api';
import type { Supplier, SupplierFormData } from '@/types';
import { useToast } from '@/hooks/use-toast';

const emptyFormData: SupplierFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(emptyFormData);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredSuppliers(
        suppliers.filter(
          s =>
            s.name.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query) ||
            s.phone.includes(query)
        )
      );
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [suppliers, searchQuery]);

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersApi.getAll();
      setSuppliers(response.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch suppliers', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setSelectedSupplier(supplier);
      setFormData({
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address || '',
      });
    } else {
      setSelectedSupplier(null);
      setFormData(emptyFormData);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.email) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (selectedSupplier) {
        await suppliersApi.update(selectedSupplier.id, formData);
        toast({ title: 'Success', description: 'Supplier updated successfully' });
      } else {
        await suppliersApi.create(formData);
        toast({ title: 'Success', description: 'Supplier created successfully' });
      }
      await fetchSuppliers();
      setIsModalOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save supplier', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;

    setIsSaving(true);
    try {
      await suppliersApi.delete(selectedSupplier.id);
      toast({ title: 'Success', description: 'Supplier deleted successfully' });
      await fetchSuppliers();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete supplier', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout
      title="Suppliers"
      subtitle="Manage your product suppliers"
      actions={
        <Button onClick={() => handleOpenModal()} className="btn-gradient">
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Supplier Directory
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No suppliers found</p>
              <p className="text-sm text-muted-foreground">Add your first supplier to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="table-row-hover">
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {supplier.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {supplier.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.address ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-48">{supplier.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenModal(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
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
            <DialogTitle>{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            <DialogDescription>
              {selectedSupplier ? 'Update the supplier details below.' : 'Fill in the details for the new supplier.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Company Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tech Distributors Ltd"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Phone *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., 08012345678"
                />
              </div>
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., contact@supplier.com"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 123 Business Street, Lagos"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="btn-gradient">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedSupplier ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedSupplier?.name}"?
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
