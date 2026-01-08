import { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Sale } from '@/types';

interface ThermalReceiptProps {
  sale: Sale;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  receiptFooter?: string;
}

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  (
    {
      sale,
      storeName = 'PhoneStore',
      storeAddress = '123 Tech Street, Lagos',
      storePhone = '08012345678',
      receiptFooter = 'Thank you for your purchase!\nGoods sold are not returnable.',
    },
    ref
  ) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const receiptDate = new Date(sale.created_at);
    const transactionId = `#${sale.id.toString().padStart(4, '0')}`;

    return (
      <div
        ref={ref}
        className="thermal-receipt"
        style={{
          width: '80mm',
          maxWidth: '80mm',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '12px',
          lineHeight: '1.4',
          padding: '10px',
          backgroundColor: 'white',
          color: 'black',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
            {storeName}
          </div>
          <div style={{ fontSize: '10px' }}>{storeAddress}</div>
          <div style={{ fontSize: '10px' }}>Tel: {storePhone}</div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Transaction Info */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Receipt:</span>
            <span style={{ fontWeight: 'bold' }}>{transactionId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Date:</span>
            <span>{format(receiptDate, 'dd/MM/yyyy')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Time:</span>
            <span>{format(receiptDate, 'HH:mm:ss')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cashier:</span>
            <span>#{sale.created_by}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment:</span>
            <span style={{ textTransform: 'uppercase' }}>{sale.payment_method}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Items Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: '11px',
            marginBottom: '4px',
          }}
        >
          <span style={{ flex: 2 }}>ITEM</span>
          <span style={{ flex: 1, textAlign: 'right' }}>QTY</span>
          <span style={{ flex: 1, textAlign: 'right' }}>PRICE</span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #000', margin: '4px 0' }} />

        {/* Items */}
        <div style={{ marginBottom: '8px' }}>
          {sale.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  marginBottom: '2px',
                  wordBreak: 'break-word',
                }}
              >
                {item.product.brand} {item.product.model}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                }}
              >
                <span style={{ flex: 2 }}>@ {formatCurrency(item.unit_price)}</span>
                <span style={{ flex: 1, textAlign: 'right' }}>x{item.quantity}</span>
                <span style={{ flex: 1, textAlign: 'right' }}>
                  {formatCurrency(item.total_price)}
                </span>
              </div>
              {item.imei && (
                <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                  IMEI: {item.imei.imei_number}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Subtotal & Total */}
        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              marginBottom: '4px',
            }}
          >
            <span>Subtotal:</span>
            <span>{formatCurrency(sale.total_amount)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              marginBottom: '4px',
            }}
          >
            <span>Tax (0%):</span>
            <span>{formatCurrency(0)}</span>
          </div>
          <div style={{ borderTop: '1px solid #000', margin: '4px 0' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            <span>TOTAL:</span>
            <span>{formatCurrency(sale.total_amount)}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Items Count */}
        <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '8px' }}>
          Total Items: {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          {receiptFooter.split('\n').map((line, index) => (
            <div
              key={index}
              style={{
                fontSize: index === 0 ? '11px' : '10px',
                color: index === 0 ? 'inherit' : '#666',
                marginBottom: '2px',
              }}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Barcode placeholder */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '16px',
            paddingTop: '8px',
            borderTop: '1px dashed #000',
          }}
        >
          <div
            style={{
              fontFamily: "'Libre Barcode 39', cursive",
              fontSize: '32px',
              letterSpacing: '2px',
            }}
          >
            *{sale.id.toString().padStart(8, '0')}*
          </div>
          <div style={{ fontSize: '9px' }}>{transactionId}</div>
        </div>

        {/* Cut line indicator */}
        <div
          style={{
            marginTop: '20px',
            borderTop: '1px dashed #ccc',
            paddingTop: '4px',
            textAlign: 'center',
            fontSize: '8px',
            color: '#999',
          }}
        >
          ✂ - - - - - - - - - - - - - - - - - - - - - - -
        </div>
      </div>
    );
  }
);

ThermalReceipt.displayName = 'ThermalReceipt';
