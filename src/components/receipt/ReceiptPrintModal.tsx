import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ThermalReceipt } from './ThermalReceipt';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import type { Sale } from '@/types';

interface ReceiptPrintModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptPrintModal({ sale, open, onOpenChange }: ReceiptPrintModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { settings } = useStoreSettings();
  const handlePrint = () => {
    if (!receiptRef.current || !sale) return;

    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=320,height=600');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt #${sale.id.toString().padStart(4, '0')}</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                line-height: 1.4;
                background: white;
                color: black;
                width: 80mm;
                padding: 0;
              }
              
              .thermal-receipt {
                width: 80mm !important;
                max-width: 80mm !important;
                padding: 10px;
              }

              @media print {
                body {
                  width: 80mm;
                }
                
                .thermal-receipt {
                  width: 80mm !important;
                  max-width: 80mm !important;
                }
                
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="thermal-receipt">
              ${printContent}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-fit p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Receipt Preview</DialogTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="p-6 bg-muted/30 overflow-auto max-h-[70vh]">
          <div className="mx-auto shadow-lg border rounded-sm bg-white">
            <ThermalReceipt
              ref={receiptRef}
              sale={sale}
              storeName={settings.storeName}
              storeAddress={settings.storeAddress}
              storePhone={settings.storePhone}
              receiptFooter={settings.receiptFooter}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            This preview shows how the receipt will appear on an 80mm thermal printer.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
