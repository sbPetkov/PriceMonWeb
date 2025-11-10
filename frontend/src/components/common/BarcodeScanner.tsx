import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onScanError?: (error: string) => void;
  className?: string;
}

const BarcodeScanner = ({ onScanSuccess, onScanError, className = '' }: BarcodeScannerProps) => {
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isScanningRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [error, setError] = useState('');
  const [showCameraSelect, setShowCameraSelect] = useState(false);

  // Define stopScanning with useCallback
  const stopScanning = useCallback(async () => {
    if (!scannerRef.current || !isScanningRef.current) {
      return;
    }

    try {
      console.log('Stopping camera scanner...');

      // Stop all video streams
      scannerRef.current.reset();

      // Reset refs and state
      scannerRef.current = null;
      isScanningRef.current = false;
      setIsScanning(false);

      console.log('Camera stopped successfully');
    } catch (err) {
      console.error('Error stopping scanner:', err);
      // Force reset even on error
      scannerRef.current = null;
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, []);

  // Define startScanningWithCamera with useCallback
  const startScanningWithCamera = useCallback(async (cameraId: string) => {
    if (!cameraId) {
      setError('No camera selected');
      return;
    }

    // Prevent multiple simultaneous starts
    if (isScanningRef.current || scannerRef.current) {
      console.log('Scanner already running, skipping start');
      return;
    }

    if (!videoRef.current) {
      setError('Video element not ready');
      return;
    }

    try {
      console.log('Starting camera scanner with device:', cameraId);

      // Configure scanner to support only common consumer goods barcode formats
      const hints = new Map();
      const formats = [
        BarcodeFormat.EAN_13,  // Most common retail barcode worldwide
        BarcodeFormat.EAN_8,   // Shorter EAN format
        BarcodeFormat.UPC_A,   // North American barcode
        BarcodeFormat.UPC_E,   // Compressed UPC
      ];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

      const scanner = new BrowserMultiFormatReader(hints);
      scannerRef.current = scanner;

      // Start scanning
      await scanner.decodeFromVideoDevice(
        cameraId,
        videoRef.current,
        async (result, error) => {
          if (result) {
            // Success callback when barcode is scanned
            console.log('Barcode scanned:', result.getText());

            // Stop the camera FIRST before calling the callback
            await stopScanning();

            // Then call the success callback (which will navigate away)
            onScanSuccess(result.getText());
          }
          if (error && error.name !== 'NotFoundException') {
            // Log errors except NotFoundException (normal when no barcode in frame)
            console.debug('Scan attempt:', error);
          }
        }
      );

      isScanningRef.current = true;
      setIsScanning(true);
      setError('');
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to start camera';
      setError(errorMsg);
      if (onScanError) onScanError(errorMsg);
      scannerRef.current = null;
      isScanningRef.current = false;
    }
  }, [onScanSuccess, onScanError, stopScanning]);

  // Load cameras on mount
  useEffect(() => {
    const loadCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');

        if (videoDevices.length > 0) {
          setCameras(videoDevices);

          // Enhanced camera selection - prefer main back camera, avoid ultra-wide
          // Priority: main > back > rear > environment > first camera
          let preferredCamera = videoDevices[0]; // Default to first

          // Try to find the best camera
          for (const device of videoDevices) {
            const label = device.label.toLowerCase();

            // Highest priority: main camera (avoids ultra-wide on Android)
            if (label.includes('main') || label.includes('wide 1') || label.includes('camera 0')) {
              preferredCamera = device;
              break;
            }

            // Second priority: back camera (but not ultra-wide)
            if ((label.includes('back') || label.includes('rear')) &&
                !label.includes('ultra') &&
                !label.includes('wide 2')) {
              preferredCamera = device;
              // Don't break, keep looking for "main"
            }

            // Third priority: environment facing
            if (label.includes('environment')) {
              if (!label.includes('ultra') && !label.includes('wide 2')) {
                preferredCamera = device;
              }
            }
          }

          setSelectedCamera(preferredCamera.deviceId);

          // Automatically start scanning with selected camera
          if (preferredCamera.deviceId) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
              startScanningWithCamera(preferredCamera.deviceId);
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

    loadCameras();
  }, [onScanError, startScanningWithCamera]);

  // Handle page visibility change to stop camera when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isScanningRef.current) {
        console.log('Tab hidden, stopping camera...');
        stopScanning();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopScanning]);

  const startScanning = useCallback(async () => {
    await startScanningWithCamera(selectedCamera);
  }, [selectedCamera, startScanningWithCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanningRef.current) {
        console.log('Component unmounting, cleaning up scanner...');
        try {
          scannerRef.current.reset();
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
      }
    };
  }, []);

  const handleCameraChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCamera = e.target.value;
    setSelectedCamera(newCamera);
    if (isScanningRef.current) {
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
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${camera.deviceId}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner Region with Animation */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg overflow-hidden bg-black"
          style={{ minHeight: '300px', objectFit: 'cover' }}
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
