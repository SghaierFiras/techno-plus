import React, { useState } from 'react';
import { 
  Camera, 
  ScanLine, 
  QrCode, 
  Barcode, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import BarcodeScanButton from '@/components/barcode/BarcodeScanButton';
import { ScanResult } from '@/lib/barcodeScanner';

interface ScanHistoryItem extends ScanResult {
  id: string;
  deviceInfo: string;
  success: boolean;
}

export default function BarcodeScannerDemo() {
  const { toast } = useToast();
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<string>('');

  // Get device information
  React.useEffect(() => {
    const userAgent = navigator.userAgent;
    let device = 'Desktop';
    
    if (/Android/i.test(userAgent)) {
      device = 'Android';
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      device = 'iOS';
    } else if (/Windows Phone/i.test(userAgent)) {
      device = 'Windows Phone';
    }
    
    setDeviceInfo(device);
  }, []);

  const handleScan = (barcode: string, format: string) => {
    const scanItem: ScanHistoryItem = {
      id: Date.now().toString(),
      text: barcode,
      format: format,
      timestamp: Date.now(),
      deviceInfo: deviceInfo,
      success: true
    };

    setScanHistory(prev => [scanItem, ...prev.slice(0, 9)]); // Keep last 10 scans

    toast({
      title: "Barcode Scanned Successfully",
      description: `${format}: ${barcode}`,
    });
  };

  const clearHistory = () => {
    setScanHistory([]);
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Android':
      case 'iOS':
        return <Smartphone className="h-4 w-4" />;
      case 'Windows Phone':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getFormatIcon = (format: string) => {
    if (format === 'QR_CODE') {
      return <QrCode className="h-4 w-4" />;
    }
    return <Barcode className="h-4 w-4" />;
  };

  const supportedFormats = [
    { name: 'QR Code', format: 'QR_CODE', description: '2D matrix barcode' },
    { name: 'EAN-13', format: 'EAN_13', description: '13-digit European Article Number' },
    { name: 'EAN-8', format: 'EAN_8', description: '8-digit European Article Number' },
    { name: 'UPC-A', format: 'UPC_A', description: '12-digit Universal Product Code' },
    { name: 'UPC-E', format: 'UPC_E', description: '8-digit Universal Product Code' },
    { name: 'Code 128', format: 'CODE_128', description: 'Variable length alphanumeric' },
    { name: 'Code 39', format: 'CODE_39', description: 'Variable length alphanumeric' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Barcode Scanner Demo
        </h1>
        <p className="text-muted-foreground">
          Test and demonstrate real-time barcode scanning capabilities
        </p>
      </div>

      {/* Device Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {getDeviceIcon(deviceInfo)}
            <span className="font-medium">{deviceInfo}</span>
            <Badge variant="outline">
              {typeof navigator.mediaDevices?.getUserMedia === 'function'
                ? 'Camera Supported' 
                : 'Camera Not Supported'
              }
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Scanner Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Real-time Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to open the camera scanner. Position barcodes within the frame for optimal scanning.
            </p>
            
            <div className="flex gap-2">
              <BarcodeScanButton
                onScan={handleScan}
                variant="default"
                size="lg"
                className="flex-1"
                title="Open Barcode Scanner"
                description="Scan 1D and 2D barcodes in real-time"
              >
                <ScanLine className="h-4 w-4" />
                Start Scanning
              </BarcodeScanButton>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Tips for best results:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure adequate lighting</li>
                <li>Hold device steady</li>
                <li>Position barcode within the frame</li>
                <li>Keep barcode clean and undamaged</li>
                <li>Use torch/flashlight in low light</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Supported Formats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              Supported Formats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supportedFormats.map((format) => (
                <div key={format.format} className="flex items-center gap-3">
                  {getFormatIcon(format.format)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{format.name}</div>
                    <div className="text-xs text-muted-foreground">{format.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {format.format}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scan History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Scan History
            </div>
            {scanHistory.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearHistory}>
                Clear History
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scanHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ScanLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scans yet. Try scanning a barcode to see results here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scanHistory.map((scan) => (
                <div key={scan.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {scan.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getFormatIcon(scan.format)}
                      <span className="font-medium">{scan.text}</span>
                      <Badge variant="outline" className="text-xs">
                        {scan.format}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {getDeviceIcon(scan.deviceInfo)}
                      <span>{scan.deviceInfo}</span>
                      <span>•</span>
                      <span>{new Date(scan.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Scanner Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Real-time Processing</h4>
              <p className="text-sm text-muted-foreground">
                Continuous frame analysis using requestAnimationFrame for smooth performance
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Multi-format Support</h4>
              <p className="text-sm text-muted-foreground">
                Supports both 1D and 2D barcodes including QR codes, UPC, EAN, and Code 128
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Error Handling</h4>
              <p className="text-sm text-muted-foreground">
                Robust error handling for damaged barcodes, poor lighting, and device compatibility
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Device Feedback</h4>
              <p className="text-sm text-muted-foreground">
                Audio beeps, vibration, and visual feedback for successful scans
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Torch Control</h4>
              <p className="text-sm text-muted-foreground">
                Built-in flashlight/torch control for low-light scanning conditions
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Cross-platform</h4>
              <p className="text-sm text-muted-foreground">
                Works on desktop, tablet, and mobile devices with responsive design
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 