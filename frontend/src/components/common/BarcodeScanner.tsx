import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onScanError?: (error: string) => void;
  className?: string;
}

const BarcodeScanner = ({ onScanSuccess, onScanError, className = '' }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  // Initialize and get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCamera = devices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        } else {
          setError('No cameras found on this device');
          if (onScanError) onScanError('No cameras found on this device');
        }
      } catch (err: any) {
        let errorMsg = 'Failed to access camera. ';

        // Check if it's a permissions or security issue
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          errorMsg += 'Camera access was denied. Please grant camera permissions in your browser settings.';
        } else if (err?.name === 'NotSecureError' || window.location.protocol === 'http:') {
          errorMsg += 'Camera access requires HTTPS. Please use manual entry or access via HTTPS.';
        } else {
          errorMsg += 'Please ensure camera permissions are granted or use manual entry.';
        }

        setError(errorMsg);
        if (onScanError) onScanError(errorMsg);
      }
    };

    getCameras();
  }, [onScanError]);

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    try {
      // Configure scanner to support multiple barcode formats
      const config = {
        formatsToSupport: [
          // Common barcode formats for retail products
          Html5QrcodeSupportedFormats.EAN_13,      // Most common retail barcode
          Html5QrcodeSupportedFormats.EAN_8,       // Shorter EAN format
          Html5QrcodeSupportedFormats.UPC_A,       // North American barcode
          Html5QrcodeSupportedFormats.UPC_E,       // Compressed UPC
          Html5QrcodeSupportedFormats.CODE_128,    // Versatile barcode format
          Html5QrcodeSupportedFormats.CODE_39,     // Industrial barcode
          Html5QrcodeSupportedFormats.CODE_93,     // Compact barcode
          Html5QrcodeSupportedFormats.ITF,         // Interleaved 2 of 5
          Html5QrcodeSupportedFormats.QR_CODE,     // QR codes (bonus)
        ],
        verbose: false,
      };

      const scanner = new Html5Qrcode('barcode-scanner-region', config);
      scannerRef.current = scanner;

      await scanner.start(
        selectedCamera,
        {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
        },
        (decodedText) => {
          // Success callback when barcode is scanned
          onScanSuccess(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Error callback - usually fires continuously while scanning
          // We don't need to show these as they're normal scanning attempts
          console.debug('Scan attempt:', errorMessage);
        }
      );

      setIsScanning(true);
      setError('');
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to start camera';
      setError(errorMsg);
      if (onScanError) onScanError(errorMsg);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(e.target.value);
    if (isScanning) {
      stopScanning();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Camera Selection */}
      {cameras.length > 1 && (
        <div>
          <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Camera
          </label>
          <select
            id="camera-select"
            value={selectedCamera}
            onChange={handleCameraChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isScanning}
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner Region */}
      <div className="relative">
        <div
          id="barcode-scanner-region"
          className="w-full rounded-lg overflow-hidden bg-black"
          style={{ minHeight: isScanning ? '300px' : '0px' }}
        />

        {isScanning && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Scanning...
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            disabled={!selectedCamera}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Start Camera Scanner
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Stop Scanning
          </button>
        )}
      </div>

      {/* Instructions */}
      {isScanning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          <p className="font-medium mb-1">How to scan:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Hold your device steady</li>
            <li>Position the barcode within the red box</li>
            <li>Ensure good lighting for best results</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
