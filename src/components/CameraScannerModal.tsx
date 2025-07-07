import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface CameraScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  title?: string;
}

export default function CameraScannerModal({
  open,
  onClose,
  onScanSuccess,
  title = 'Scan Barcode or QR Code',
}: CameraScannerModalProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setIsLoading(true);
    // Clean up any previous scanner
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    // Only initialize if container is present
    if (containerRef.current) {
      try {
        // Allow camera on localhost (no HTTPS required)
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isLocalhost && window.location.protocol !== 'https:') {
          setError('Camera access requires HTTPS. Please use a secure connection.');
          setIsLoading(false);
          return;
        }
        const config = {
          fps: 10,
          qrbox: 250,
          rememberLastUsedCamera: true,
          facingMode: { exact: 'environment' },
        };
        scannerRef.current = new Html5QrcodeScanner(
          containerRef.current.id,
          config,
          false
        );
        scannerRef.current.render(
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current.clear().catch(() => {});
              scannerRef.current = null;
            }
            onScanSuccess(decodedText);
            onClose();
          },
          (err) => {
            setError(typeof err === 'string' ? err : 'Camera error. Please check your device permissions or try a different device.');
          }
        );
        setIsLoading(false);
      } catch (e: unknown) {
        const err = e as Error;
        setError(
          err.message?.includes('not supported')
            ? 'No camera found on this device. Please use a device with a camera.'
            : err.message || 'Failed to start camera. Please check your device permissions.'
        );
        setIsLoading(false);
      }
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Camera scanner for barcode and QR code. Grant camera access to scan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error ? (
            <div className="flex flex-col items-center text-destructive">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="text-center text-sm mb-2">{error}</p>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <div
                id="scanner-container"
                ref={containerRef}
                className="w-full aspect-square bg-black rounded-lg flex items-center justify-center"
              >
                {isLoading && (
                  <span className="text-muted-foreground">Loading camera...</span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (scannerRef.current) {
                    scannerRef.current.clear().catch(() => {});
                    scannerRef.current = null;
                  }
                  onClose();
                }}
                className="w-full mt-2"
              >
                <X className="h-4 w-4 mr-2" /> Close Scanner
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 