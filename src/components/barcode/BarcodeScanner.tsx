import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Flashlight, FlashlightOff, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { barcodeScanner, ScanResult, ScannerOptions } from '../../lib/barcodeScanner';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string, format: string) => void;
  title?: string;
  description?: string;
  options?: ScannerOptions;
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode',
  description = 'Position the barcode within the frame to scan',
  options = {}
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError(null);
      setHasPermission(null);
      
      await barcodeScanner.initialize();
      setHasPermission(true);

      if (videoRef.current) {
        await barcodeScanner.startScanning(
          videoRef.current,
          handleScanResult,
          handleScanError
        );
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Failed to start scanning:', err);
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setHasPermission(false);
    }
  };

  const stopScanning = () => {
    barcodeScanner.stopScanning();
    setIsScanning(false);
    setTorchEnabled(false);
  };

  const handleScanResult = (result: ScanResult) => {
    console.log('Barcode scanned:', result);
    setLastScan(result);
    setScanSuccess(true);

    // Validate the barcode
    if (barcodeScanner.constructor.validateBarcode(result.text, result.format)) {
      onScan(result.text, result.format);
      
      // Auto-close after successful scan
      setTimeout(() => {
        onClose();
        setScanSuccess(false);
        setLastScan(null);
      }, 1500);
    } else {
      setError('Invalid barcode format detected');
      // Resume scanning after a short delay
      setTimeout(() => {
        if (isOpen && videoRef.current) {
          startScanning();
        }
      }, 2000);
    }
  };

  const handleScanError = (err: Error) => {
    console.error('Scan error:', err);
    setError(err.message);
  };

  const toggleTorch = async () => {
    try {
      await barcodeScanner.toggleTorch();
      setTorchEnabled(!torchEnabled);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  const retryScanning = () => {
    setError(null);
    setLastScan(null);
    setScanSuccess(false);
    startScanning();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          {/* Camera View */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {hasPermission === false ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                    <CameraOff className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-center text-sm">
                      Camera access denied. Please enable camera permissions and try again.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={retryScanning}
                      className="mt-4 text-black"
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    
                    {/* Scanning Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Scanning Frame */}
                        <div className={cn(
                          "w-64 h-40 border-2 rounded-lg transition-colors duration-300",
                          scanSuccess ? "border-green-500" : "border-white",
                          isScanning && !scanSuccess && "animate-pulse"
                        )}>
                          {/* Corner indicators */}
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-white rounded-br-lg" />
                          
                          {/* Scanning line */}
                          {isScanning && !scanSuccess && (
                            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white opacity-75 animate-pulse" />
                          )}
                        </div>
                        
                        {/* Success indicator */}
                        {scanSuccess && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-green-500 rounded-full p-3">
                              <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={toggleTorch}
                        className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                      >
                        {torchEnabled ? (
                          <FlashlightOff className="h-4 w-4" />
                        ) : (
                          <Flashlight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Messages */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={retryScanning}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {lastScan && (
            <Card className="border-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Barcode Detected</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{lastScan.format}</Badge>
                    <span className="text-sm font-mono">{lastScan.text}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scanned at {new Date(lastScan.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {isScanning && !error && !scanSuccess && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Hold your device steady and position the barcode within the frame
              </p>
              <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>• EAN-13</span>
                <span>• UPC-A</span>
                <span>• Code 128</span>
                <span>• QR Code</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            {error && (
              <Button onClick={retryScanning} className="flex-1">
                Retry
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}