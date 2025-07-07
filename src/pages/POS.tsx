import React, { useState } from 'react';
import { CreditCard, RotateCcw, AlertCircle } from 'lucide-react';
import { usePOS } from '../hooks/usePOS';
import BarcodeScanner from '../components/pos/BarcodeScanner';
import CartDisplay from '../components/pos/CartDisplay';
import PaymentModal from '../components/pos/PaymentModal';
import Receipt from '../components/pos/Receipt';
import ProductSearch from '../components/pos/ProductSearch';
import { PaymentMethod, Receipt as ReceiptType } from '../types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import TransactionsTable from '../components/transactions/TransactionsTable';
import CameraScannerModal from '../components/CameraScannerModal';

export default function POS() {
  const { toast } = useToast();
  const {
    cart,
    settings,
    isProcessing,
    lastTransaction,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    applyDiscount,
    clearCart,
    processTransaction,
    findProductByBarcode
  } = usePOS();
  const { t } = useTranslation();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  const handleBarcodeScan = async (barcode: string) => {
    try {
      setError(null);
      setSearchQuery('');
      
      const result = await findProductByBarcode(barcode);
      
      if (result) {
        await addToCart(result.product, result.variant);
        toast({
          title: "Product Added",
          description: `Added ${result.product.name} to cart`,
        });
      } else {
        // If not found by barcode, try as search query
        setSearchQuery(barcode);
        toast({
          title: "Product Not Found",
          description: "No product found with this barcode",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('Error processing barcode scan');
      console.error('Barcode scan error:', err);
      toast({
        title: "Scan Error",
        description: "Failed to process the scanned barcode",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async (payment: PaymentMethod, customerInfo: { id: string } | null) => {
    try {
      setError(null);
      await processTransaction(payment, customerInfo);
      setShowPaymentModal(false);
      setShowReceipt(true);
      toast({
        title: "Transaction Complete",
        description: "Payment processed successfully",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      console.error('Payment error:', err);
      toast({
        title: "Payment Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleEmailReceipt = () => {
    toast({
      title: "Coming Soon",
      description: "Email receipt functionality will be available soon",
    });
  };

  const handleDownloadReceipt = () => {
    toast({
      title: "Coming Soon",
      description: "Download receipt functionality will be available soon",
    });
  };

  const receipt: ReceiptType | null = lastTransaction ? {
    transaction: lastTransaction,
    store_info: {
      name: 'Tech Store',
      address: '123 Main St, City, Province',
      phone: '(555) 123-4567',
      email: 'info@techstore.com'
    }
  } : null;

  return (
    <div className="px-4 md:px-8 space-y-6 min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('pos.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('pos.scanBarcodeMessage')}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/10 dark:bg-destructive/30">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="mt-2 h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-8">
        {/* Left Column - Scanner and Search */}
        <div className="space-y-6 min-w-0 overflow-y-auto">
          {/* Barcode Scanner with Camera Modal integration */}
          <Card className="bg-card border border-border dark:bg-card/80 w-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {t('pos.productScanner')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-2">
                <BarcodeScanner
                  onScan={handleBarcodeScan}
                  isEnabled={settings.barcode_scanner_enabled}
                  placeholder={t('pos.scanPlaceholder')}
                  addToCart={addToCart}
                  onCameraScanClick={() => setShowCameraScanner(true)}
                />
                <CameraScannerModal
                  open={showCameraScanner}
                  onClose={() => setShowCameraScanner(false)}
                  onScanSuccess={(barcode) => {
                    setShowCameraScanner(false);
                    handleBarcodeScan(barcode);
                  }}
                  title="Scan Product Barcode"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border border-border dark:bg-card/80 w-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {t('pos.quickActions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="border-border text-foreground dark:bg-background/80"
                >
                  {t('pos.clearSearch')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => applyDiscount(10)}
                  disabled={cart.items.length === 0}
                  className="border-border text-foreground dark:bg-background/80"
                >
                  {t('pos.discount', { value: '10%' })}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => applyDiscount(undefined, 2)}
                  disabled={cart.items.length === 0}
                  className="border-border text-foreground dark:bg-background/80"
                >
                  {t('pos.discount', { value: '$5' })}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => applyDiscount(0, 0)}
                  disabled={cart.discount_amount === 0}
                  className="border-border text-foreground dark:bg-background/80"
                >
                  {t('pos.removeDiscount')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cart and Checkout */}
        <div className="space-y-6 min-w-0 lg:sticky lg:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
          {/* Cart Display */}
          <CartDisplay
            cart={cart}
            onUpdateQuantity={updateItemQuantity}
            onRemoveItem={removeFromCart}
            onApplyDiscount={applyDiscount}
            currency={settings.currency}
          />

          {/* Checkout Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={clearCart}
              disabled={cart.items.length === 0 || isProcessing}
              className="flex-1 border-border text-foreground dark:bg-background/80"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('pos.clearCart')}
            </Button>
            {cart.items.length > 0 && (
              <Button
                onClick={() => setShowPaymentModal(true)}
                disabled={isProcessing}
                className="flex-1 bg-primary text-primary-foreground border-border dark:bg-primary dark:text-primary-foreground"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isProcessing ? t('pos.processing') : `${t('pos.checkout')} - ${new Intl.NumberFormat('en-CA', {
                  style: 'currency',
                  currency: settings.currency
                }).format(cart.total)}`}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          total={cart.total}
          onPayment={handlePayment}
          onCancel={() => setShowPaymentModal(false)}
          currency={settings.currency}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && receipt && (
        <Receipt
          receipt={receipt}
          onPrint={handlePrintReceipt}
          onEmail={handleEmailReceipt}
          onDownload={handleDownloadReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Place TransactionsTable below the main POS interface */}
      <div className="w-full max-w-screen mt-8">
        <TransactionsTable />
      </div>
    </div>
  );
}