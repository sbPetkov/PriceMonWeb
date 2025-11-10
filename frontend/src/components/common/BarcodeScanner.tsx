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
  const [showCameraSelect, setShowCameraSelect] = useState(false);

  // Initialize and get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);

          // Smart camera selection - prefer back/rear camera
          const backCamera = devices.find(device => {
            const label = device.label.toLowerCase();
            return label.includes('back') ||
                   label.includes('rear') ||
                   label.includes('environment') ||
                   label.includes('facing back');
          });

          // Auto-select the best camera
          const preferredCamera = backCamera?.id || devices[0].id;
          setSelectedCamera(preferredCamera);

          // Automatically start scanning with back camera
          if (preferredCamera) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
              startScanningWithCamera(preferredCamera);
            }, 100);
          }
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

  const startScanningWithCamera = async (cameraId: string) => {
    if (!cameraId) {
      setError('No camera selected');
      return;
    }

    try {
      // Configure scanner to support only common consumer goods barcode formats
      const config = {
        formatsToSupport: [
          // Most common retail barcode formats (reduced for better performance)
          Html5QrcodeSupportedFormats.EAN_13,      // Most common retail barcode worldwide
          Html5QrcodeSupportedFormats.EAN_8,       // Shorter EAN format
          Html5QrcodeSupportedFormats.UPC_A,       // North American barcode
          Html5QrcodeSupportedFormats.UPC_E,       // Compressed UPC
        ],
        verbose: false,
      };

      const scanner = new Html5Qrcode('barcode-scanner-region', config);
      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 30, // Increased from 10 to 30 for faster scanning
          qrbox: { width: 280, height: 120 }, // Wider box for barcodes (they're horizontal)
          aspectRatio: 1.777778, // 16:9 aspect ratio for better camera view
          // Advanced camera settings
          advanced: [
            {
              zoom: { min: 1.0, max: 3.0, step: 0.1 }
            },
            {
              focusMode: 'continuous' // Continuous autofocus for better barcode detection
            },
            {
              torch: false // Flashlight off by default
            }
          ] as any,
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

  const startScanning = async () => {
    await startScanningWithCamera(selectedCamera);
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        // Don't call clear() to prevent white screen
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
        setIsScanning(false);
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

  const handleCameraChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCamera = e.target.value;
    setSelectedCamera(newCamera);
    if (isScanning) {
      await stopScanning();
      // Restart with new camera
      setTimeout(() => {
        startScanningWithCamera(newCamera);
      }, 100);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Camera Selection - Hidden by default, can be shown */}
      {cameras.length > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowCameraSelect(!showCameraSelect)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {showCameraSelect ? 'Hide' : 'Switch'} Camera
          </button>
        </div>
      )}

      {showCameraSelect && cameras.length > 1 && (
        <div>
          <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Camera
          </label>
          <select
            id="camera-select"
            value={selectedCamera}
            onChange={handleCameraChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner Region with Animation */}
      <div className="relative">
        <div
          id="barcode-scanner-region"
          className="w-full rounded-lg overflow-hidden bg-black"
          style={{ minHeight: '300px' }}
        />

        {/* Scanning Animation Overlay */}
        {isScanning && (
          <>
            {/* Scanning Line Animation */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-full h-full max-w-md">
                {/* Red scanning line */}
                <div className="absolute w-full h-0.5 bg-red-500 shadow-lg animate-scan"
                     style={{
                       boxShadow: '0 0 10px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.6)',
                       animation: 'scan 2s linear infinite'
                     }}
                />

                {/* Corner brackets for scanning area */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative" style={{ width: '280px', height: '120px' }}>
                    {/* Top-left corner */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500"></div>
                    {/* Top-right corner */}
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500"></div>
                    {/* Bottom-left corner */}
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500"></div>
                    {/* Bottom-right corner */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span className="font-semibold">Scanning...</span>
            </div>
          </>
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
          <p className="font-medium mb-1">📱 Scanning Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Hold your device steady and parallel to the barcode</li>
            <li>Position the barcode within the red corners</li>
            <li>Ensure good lighting for best results</li>
            <li>Keep the barcode 10-15cm from the camera</li>
          </ul>
        </div>
      )}

      {/* CSS Animation for scanning line */}
      <style>{`
        @keyframes scan {
          0% {
            top: 20%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 80%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
