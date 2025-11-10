import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onScanError?: (error: string) => void;
  className?: string;
}

const BarcodeScanner = ({ onScanSuccess, onScanError, className = '' }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [error, setError] = useState('');
  const [showCameraSelect, setShowCameraSelect] = useState(false);

  // Load cameras on mount
  useEffect(() => {
    const loadCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');

          // Enhanced camera selection - prefer main back camera, avoid ultra-wide
          // Priority: main > back > rear > environment > first camera
          let preferredCamera = devices[0]; // Default to first

          // Try to find the best camera
          for (const device of devices) {
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
            if (label.includes('environment') && !preferredCamera) {
              preferredCamera = device;
            }
          }

          setSelectedCamera(preferredCamera.id);

          // Automatically start scanning with selected camera
          if (preferredCamera.id) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
              startScanningWithCamera(preferredCamera.id);
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
      } catch (err) {
        setError('Camera access failed');
        onScanError?.('Camera access failed');
      }
    };

    getCameras();
  }, [onScanError]);

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
  }, []);

  const startScanningWithCamera = async (cameraId: string) => {
    if (!cameraId) {
      setError('No camera selected');
      return;
    }

    // Prevent multiple simultaneous starts
    if (isScanningRef.current || scannerRef.current) {
      console.log('Scanner already running, skipping start');
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
        async (decodedText) => {
          // Success callback when barcode is scanned
          console.log('Barcode scanned:', decodedText);

          // Stop the camera FIRST before calling the callback
          await stopScanning();

          // Then call the success callback (which will navigate away)
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Error callback - usually fires continuously while scanning
          // We don't need to show these as they're normal scanning attempts
          console.debug('Scan attempt:', errorMessage);
        }
      );

      isScanningRef.current = true;
      setIsScanning(true);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to start camera';
      setError(errorMsg);
      if (onScanError) onScanError(errorMsg);
      scannerRef.current = null;
      isScanningRef.current = false;
    }
  };

  const startScanning = async () => {
    await startScanningWithCamera(selectedCamera);
  };

  const stopScanning = async () => {
    if (!scannerRef.current || !isScanningRef.current) {
      return;
    }

    try {
      console.log('Stopping camera scanner...');

      // Stop the camera stream
      await scannerRef.current.stop();

      // Clear the scanner instance
      scannerRef.current.clear();

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
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanningRef.current) {
        console.log('Component unmounting, cleaning up scanner...');
        scannerRef.current.stop().then(() => {
          if (scannerRef.current) {
            scannerRef.current.clear();
          }
        }).catch(console.error);
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
      {/* Switch Camera */}
      {cameras.length > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowCameraSelect(!showCameraSelect)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            {showCameraSelect ? 'Hide' : 'Switch'} Camera
          </button>
        </div>
      )}

      {showCameraSelect && cameras.length > 1 && (
        <select
          value={selectedCamera}
          onChange={handleCameraChange}
          className="w-full p-2 border rounded"
        >
          {cameras.map(cam => (
            <option key={cam.deviceId} value={cam.deviceId}>
              {cam.label || 'Camera'}
            </option>
          ))}
        </select>
      )}

      {/* Scanner Video */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg bg-black"
          style={{ minHeight: '300px', objectFit: 'cover' }}
        />
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <div className="flex gap-3">
        {!isScanning ? (
          <button onClick={() => startScanning(selectedCamera)} className="bg-primary text-white p-3 rounded">
            Start Scanning
          </button>
        ) : (
          <button onClick={stopScanning} className="bg-red-500 text-white p-3 rounded">
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;