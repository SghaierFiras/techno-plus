import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';
import jsQR from 'jsqr';

export interface ScanResult {
  text: string;
  format: string;
  timestamp: number;
  confidence?: number;
  attempts?: number;
}

export interface ScannerOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  torch?: boolean;
  beep?: boolean;
  vibrate?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableImageEnhancement?: boolean;
}

interface LuminanceSource {
  getRow: (y: number) => Uint8ClampedArray;
  getMatrix: () => Uint8ClampedArray;
  getWidth: () => number;
  getHeight: () => number;
}

export class BarcodeScanner {
  private reader: BrowserMultiFormatReader;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private scanning = false;
  private animationFrame: number | null = null;
  private options: ScannerOptions;
  private consecutiveFailures = 0;
  private lastScanTime = 0;
  private scanCooldown = 1000; // Prevent duplicate scans

  constructor(options: ScannerOptions = {}) {
    this.reader = new BrowserMultiFormatReader();
    this.options = {
      facingMode: 'environment',
      width: 640,
      height: 480,
      beep: true,
      vibrate: true,
      maxRetries: 3,
      retryDelay: 500,
      enableImageEnhancement: true,
      ...options
    };
  }

  async initialize(): Promise<void> {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Request camera permissions with enhanced constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.options.facingMode,
          width: { ideal: this.options.width, min: 320 },
          height: { ideal: this.options.height, min: 240 },
          frameRate: { ideal: 30, min: 15 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      throw new Error('Failed to access camera. Please ensure camera permissions are granted.');
    }
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    onScan: (result: ScanResult) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (!this.stream) {
      await this.initialize();
    }

    this.videoElement = videoElement;
    this.scanning = true;
    this.consecutiveFailures = 0;

    // Set up video element
    if (this.stream && this.videoElement) {
      this.videoElement.srcObject = this.stream;
      this.videoElement.setAttribute('playsinline', 'true');
      this.videoElement.play();

      // Create canvas for image processing
      this.canvasElement = document.createElement('canvas');
      this.context = this.canvasElement.getContext('2d');

      // Wait for video to be ready
      this.videoElement.addEventListener('loadedmetadata', () => {
        if (this.canvasElement && this.videoElement) {
          this.canvasElement.width = this.videoElement.videoWidth;
          this.canvasElement.height = this.videoElement.videoHeight;
        }
        this.scanFrame(onScan, onError);
      });
    }
  }

  private scanFrame(
    onScan: (result: ScanResult) => void,
    onError?: (error: Error) => void
  ): void {
    if (!this.scanning || !this.videoElement || !this.canvasElement || !this.context) {
      return;
    }

    try {
      // Draw current video frame to canvas
      this.context.drawImage(
        this.videoElement,
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      // Get image data
      const imageData = this.context.getImageData(
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      // Enhance image if enabled
      const enhancedImageData = this.options.enableImageEnhancement 
        ? this.enhanceImage(imageData) 
        : imageData;

      // Try ZXing first (supports more formats)
      this.tryZXingDecode(enhancedImageData, onScan, onError);

      // Try jsQR for QR codes as fallback
      this.tryJsQRDecode(enhancedImageData, onScan, onError);

    } catch (error) {
      console.warn('Frame scanning error:', error);
      this.consecutiveFailures++;
    }

    // Continue scanning
    if (this.scanning) {
      this.animationFrame = requestAnimationFrame(() => 
        this.scanFrame(onScan, onError)
      );
    }
  }

  private enhanceImage(imageData: ImageData): ImageData {
    // Create a copy of the image data
    const enhanced = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    // Apply basic image enhancement
    for (let i = 0; i < enhanced.data.length; i += 4) {
      const r = enhanced.data[i];
      const g = enhanced.data[i + 1];
      const b = enhanced.data[i + 2];

      // Convert to grayscale with enhanced contrast
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      const enhancedGray = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));

      enhanced.data[i] = enhancedGray;
      enhanced.data[i + 1] = enhancedGray;
      enhanced.data[i + 2] = enhancedGray;
    }

    return enhanced;
  }

  private tryZXingDecode(
    imageData: ImageData,
    onScan: (result: ScanResult) => void,
    onError?: (error: Error) => void
  ): void {
    try {
      // Convert ImageData to luminance array for ZXing
      const luminanceSource = this.createLuminanceSource(imageData);
      const result = this.reader.decode(luminanceSource);
      
      if (result) {
        this.handleScanResult({
          text: result.getText(),
          format: result.getBarcodeFormat().toString(),
          timestamp: Date.now(),
          confidence: 0.9,
          attempts: this.consecutiveFailures + 1
        }, onScan);
      }
    } catch (error) {
      // ZXing throws exceptions for no barcode found, which is normal
      if (!(error instanceof NotFoundException) && 
          !(error instanceof ChecksumException) && 
          !(error instanceof FormatException)) {
        console.warn('ZXing decode error:', error);
      }
      
      // Handle checksum errors (damaged barcodes)
      if (error instanceof ChecksumException) {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= (this.options.maxRetries || 3)) {
          onError?.(new Error('Barcode appears to be damaged or unreadable'));
        }
      }
    }
  }

  private tryJsQRDecode(
    imageData: ImageData,
    onScan: (result: ScanResult) => void,
    onError?: (error: Error) => void
  ): void {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code) {
        this.handleScanResult({
          text: code.data,
          format: 'QR_CODE',
          timestamp: Date.now(),
          confidence: 0.8,
          attempts: this.consecutiveFailures + 1
        }, onScan);
      }
    } catch (error) {
      console.warn('jsQR decode error:', error);
    }
  }

  private createLuminanceSource(imageData: ImageData): LuminanceSource {
    // Convert RGBA to grayscale for ZXing
    const { data, width, height } = imageData;
    const luminanceArray = new Uint8ClampedArray(width * height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Convert to grayscale using luminance formula
      const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      luminanceArray[i / 4] = luminance;
    }

    return {
      getRow: (y: number) => luminanceArray.slice(y * width, (y + 1) * width),
      getMatrix: () => luminanceArray,
      getWidth: () => width,
      getHeight: () => height
    };
  }

  private handleScanResult(result: ScanResult, onScan: (result: ScanResult) => void): void {
    // Check cooldown to prevent duplicate scans
    const now = Date.now();
    if (now - this.lastScanTime < this.scanCooldown) {
      return;
    }
    this.lastScanTime = now;

    // Reset failure counter on successful scan
    this.consecutiveFailures = 0;

    // Provide feedback
    if (this.options.beep) {
      this.playBeep();
    }

    if (this.options.vibrate && navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Stop scanning temporarily to prevent multiple scans
    this.stopScanning();

    // Call the callback
    onScan(result);
  }

  private playBeep(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play beep sound:', error);
    }
  }

  async toggleTorch(): Promise<void> {
    if (!this.stream) return;

    try {
      const track = this.stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      // Check if torch is supported (non-standard API)
      if ('torch' in capabilities) {
        const constraints = track.getConstraints();
        await track.applyConstraints({
          ...constraints,
          advanced: [{ torch: !this.options.torch } as any]
        });
        this.options.torch = !this.options.torch;
      }
    } catch (error) {
      console.warn('Torch not supported:', error);
    }
  }

  stopScanning(): void {
    this.scanning = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  isScanning(): boolean {
    return this.scanning;
  }

  // Static method to validate barcode formats
  static validateBarcode(text: string, format: string): boolean {
    switch (format) {
      case 'EAN_13':
        return /^\d{13}$/.test(text);
      case 'EAN_8':
        return /^\d{8}$/.test(text);
      case 'UPC_A':
        return /^\d{12}$/.test(text);
      case 'UPC_E':
        return /^\d{8}$/.test(text);
      case 'CODE_128':
        return text.length > 0;
      case 'CODE_39':
        return /^[A-Z0-9\-. $/+%]+$/.test(text);
      case 'QR_CODE':
        return text.length > 0;
      default:
        return text.length > 0;
    }
  }

  // Static method to format barcode for display
  static formatBarcode(text: string, format: string): string {
    switch (format) {
      case 'EAN_13':
        if (text.length === 13) {
          return `${text.slice(0, 1)} ${text.slice(1, 7)} ${text.slice(7, 13)}`;
        }
        break;
      case 'UPC_A':
        if (text.length === 12) {
          return `${text.slice(0, 1)} ${text.slice(1, 6)} ${text.slice(6, 11)} ${text.slice(11, 12)}`;
        }
        break;
    }
    return text;
  }

  // Static method to check if barcode might be damaged
  static isPotentiallyDamaged(text: string): boolean {
    // Check for common damage patterns
    const hasRepeatedChars = /(.)\1{4,}/.test(text); // 5+ repeated characters
    const hasInvalidChars = /[^A-Z0-9\-. $/+%]/.test(text); // Invalid characters for CODE_39
    const isTooShort = text.length < 3;
    
    return hasRepeatedChars || hasInvalidChars || isTooShort;
  }
}

// Export singleton instance
export const barcodeScanner = new BarcodeScanner();