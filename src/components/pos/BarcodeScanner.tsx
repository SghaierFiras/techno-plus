import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import BarcodeScanButton from '../barcode/BarcodeScanButton';
import { useTranslation } from 'react-i18next';
import ProductSearch from './ProductSearch';
import { Product, ProductVariant } from '../../types/inventory';

interface BarcodeScannerProps {
  onScan: (barcode: string, format: string) => void;
  isEnabled?: boolean;
  placeholder?: string;
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => Promise<void>;
  onCameraScanClick?: () => void;
}

export default function BarcodeScanner({ 
  onScan, 
  isEnabled = true, 
  addToCart,
  onCameraScanClick
}: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { t } = useTranslation();

  useEffect(() => {
    if (isEnabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEnabled]);

  useEffect(() => {
    const handleGlobalKeyPress = () => {
      // Only focus if the active element is the body (not an input/textarea)
      if (
        isEnabled &&
        inputRef.current &&
        document.activeElement === document.body
      ) {
        inputRef.current.focus();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyPress);
    return () => document.removeEventListener('keydown', handleGlobalKeyPress);
  }, [isEnabled]);

  const handleCameraScan = (barcode: string) => {
    onScan(barcode, '');
  };

  return (
    <div className="relative">
      {/* {onCameraScanClick && (
        <Button
          variant="outline"
          size="default"
          onClick={onCameraScanClick}
          className="mb-2"
        >
          Scan Barcode
        </Button>
      )} */}
      <div className="relative">
        <Input
          type="text"
          placeholder={t('inventory.searchPlaceholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="mt-2 bg-background border-border text-foreground dark:bg-background/80"
          autoFocus={false}
        />
        <ProductSearch
          onAddToCart={addToCart}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
          <BarcodeScanButton
            onScan={handleCameraScan}
            onClick={onCameraScanClick}
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-blue-100"
            title="Scan Product Barcode"
            description="Scan the barcode on your product to add it to the cart"
          >
            <Camera className="h-4 w-4" />
          </BarcodeScanButton>
        </div>
      </div>
      
    </div>
  );
}
