import React, { useState } from 'react';
import { ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import BarcodeScanner from './BarcodeScanner';
import { cn } from '@/lib/utils';

interface BarcodeScanButtonProps {
  onScan: (barcode: string, format: string) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export default function BarcodeScanButton({
  onScan,
  variant = 'outline',
  size = 'default',
  className,
  children,
  title = 'Scan Barcode',
  description = 'Position the barcode within the frame to scan',
  disabled = false,
  onClick
}: BarcodeScanButtonProps) {
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();

  const handleScan = (barcode: string, format: string) => {
    try {
      onScan(barcode, format);
      toast({
        title: "Barcode Scanned",
        description: `Successfully scanned ${format}: ${barcode}`,
      });
    } catch (error) {
      console.error('Error processing scanned barcode:', error);
      toast({
        title: "Scan Error",
        description: "Failed to process the scanned barcode",
        variant: "destructive",
      });
    }
  };

  const openScanner = () => {
    // Check if camera is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Camera Not Available",
        description: "Camera is not supported on this device",
        variant: "destructive",
      });
      return;
    }

    setShowScanner(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={onClick ? onClick : openScanner}
        disabled={disabled}
        className={cn("gap-2", className)}
      >
        {size === 'icon' ? (
          <ScanLine className="h-4 w-4" />
        ) : (
          <>
            <ScanLine className="h-4 w-4" />
            {children || 'Scan Barcode'}
          </>
        )}
      </Button>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
        title={title}
        description={description}
      />
    </>
  );
}