import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onScanError?: (error: string) => void;
  className?: string;
}

const BarcodeScanner = ({ onScanSuccess, onScanError, className = '' }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
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

        setCameras(videoDevices);

        // Prefer back camera
        const back = videoDevices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear')
        );

        const best = back?.deviceId || videoDevices[0]?.deviceId;
        if (best) {
          setSelectedCamera(best);
          startScanning(best);
        }
      } catch (err) {
        setError('Camera access failed');
        onScanError?.('Camera access failed');
      }
    };

    loadCameras();
  }, []);

  const startScanning = async (deviceId: string) => {
    try {
      if (!videoRef.current) return;

      // Stop previous instance if running
      stopScanning();

      // Limit formats for speed
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ]);

      const codeReader = new BrowserMultiFormatReader(hints);
      codeReaderRef.current = codeReader;

      await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            onScanSuccess(result.getText());
            stopScanning();
          }
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to start scanner');
      onScanError?.(err?.message || 'Failed to start scanner');
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setIsScanning(false);
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCam = e.target.value;
    setSelectedCamera(newCam);
    startScanning(newCam);
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