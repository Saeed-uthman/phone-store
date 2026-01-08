import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { useToast } from '@/hooks/use-toast';
import { Store, Save, RotateCcw } from 'lucide-react';

export default function StoreSettings() {
  const { settings, updateSettings } = useStoreSettings();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState(settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateSettings(formData);
    toast({
      title: 'Settings Saved',
      description: 'Your store settings have been updated successfully.',
    });
  };

  const handleReset = () => {
    setFormData(settings);
    toast({
      title: 'Changes Reverted',
      description: 'Form has been reset to saved values.',
    });
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(settings);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-muted-foreground">
            Customize your store details and receipt information
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
              <CardDescription>
                Basic details about your store that appear on receipts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  placeholder="Enter store name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storeAddress">Store Address</Label>
                <Input
                  id="storeAddress"
                  name="storeAddress"
                  value={formData.storeAddress}
                  onChange={handleChange}
                  placeholder="Enter store address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storePhone">Phone Number</Label>
                <Input
                  id="storePhone"
                  name="storePhone"
                  value={formData.storePhone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Receipt Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt Settings</CardTitle>
              <CardDescription>
                Customize the footer text that appears on printed receipts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Receipt Footer Text</Label>
                <Textarea
                  id="receiptFooter"
                  name="receiptFooter"
                  value={formData.receiptFooter}
                  onChange={handleChange}
                  placeholder="Enter footer text (e.g., Thank you message, return policy)"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Use new lines to separate different messages
                </p>
              </div>

              {/* Receipt Preview */}
              <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Preview:</p>
                <div className="bg-white p-3 rounded border font-mono text-xs text-center space-y-1">
                  <div className="font-bold">{formData.storeName || 'Store Name'}</div>
                  <div className="text-[10px]">{formData.storeAddress || 'Address'}</div>
                  <div className="text-[10px]">Tel: {formData.storePhone || 'Phone'}</div>
                  <div className="border-t border-dashed my-2" />
                  <div className="text-[10px] whitespace-pre-line">
                    {formData.receiptFooter || 'Footer text'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Changes
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
