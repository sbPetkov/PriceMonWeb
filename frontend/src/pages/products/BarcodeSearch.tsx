import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { lookupBarcode } from '../../services/productService';
import { getErrorMessage } from '../../services/api';
import BarcodeScanner from '../../components/common/BarcodeScanner';

const BarcodeSearch = () => {
  const { t } = useTranslation('products');
  const navigate = useNavigate();
  const location = useLocation();
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  const [isPageActive, setIsPageActive] = useState(true);

  // Detect when user navigates away from this page
  useEffect(() => {
    // Page is active when we're on the /scan route
    const isActive = location.pathname === '/scan';
    setIsPageActive(isActive);

    // Also handle browser tab visibility
    const handleVisibilityChange = () => {
      setIsPageActive(!document.hidden && location.pathname === '/scan');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barcode.trim()) {
      setError(t('barcodeSearch.barcodeRequired'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await lookupBarcode(barcode.trim());

      if (response.found) {
        if (response.status === 'approved' && response.product) {
          // Product exists and is approved → go to product details
          navigate(`/products/${response.product.id}`);
        } else if (response.status === 'pending') {
          // Product exists but pending approval
          setError(t('barcodeSearch.pending'));
        } else if (response.status === 'rejected') {
          // Product was rejected
          setError(t('barcodeSearch.rejected'));
        }
      } else {
        // Product not found → go to add product page with barcode pre-filled
        navigate(`/products/add?barcode=${barcode.trim()}`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
    setError(''); // Clear error when user types
  };

  const handleScanSuccess = async (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
    setIsLoading(true);
    setError('');

    try {
      const response = await lookupBarcode(scannedBarcode);

      if (response.found) {
        if (response.status === 'approved' && response.product) {
          navigate(`/products/${response.product.id}`);
        } else if (response.status === 'pending') {
          setError(t('barcodeSearch.pending'));
        } else if (response.status === 'rejected') {
          setError(t('barcodeSearch.rejected'));
        }
      } else {
        navigate(`/products/add?barcode=${scannedBarcode}`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('barcodeSearch.title')}
          </h1>
          <p className="text-gray-600">
            {t('barcodeSearch.subtitle')}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScanMode('manual')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                scanMode === 'manual'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('barcodeSearch.manualEntry')}
            </button>
            <button
              type="button"
              onClick={() => setScanMode('camera')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                scanMode === 'camera'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('barcodeSearch.cameraScanner')}
            </button>
          </div>
        </div>

        {/* Manual Entry Form */}
        {scanMode === 'manual' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSearch} className="space-y-6">
            {/* Barcode Input */}
            <div>
              <label
                htmlFor="barcode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('barcodeSearch.barcodeLabel')}
              </label>
              <div className="relative">
                <input
                  id="barcode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={barcode}
                  onChange={handleInputChange}
                  placeholder={t('barcodeSearch.barcodePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-lg font-mono"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {t('barcodeSearch.barcodeHelper')}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Search Button */}
            <button
              type="submit"
              disabled={isLoading || !barcode.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('barcodeSearch.searching')}
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {t('barcodeSearch.searchButton')}
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <svg
                className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium text-gray-900 mb-1">{t('barcodeSearch.howItWorksTitle')}</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('barcodeSearch.howItWorks1')}</li>
                  <li>{t('barcodeSearch.howItWorks2')}</li>
                  <li>{t('barcodeSearch.howItWorks3')}</li>
                </ul>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Camera Scanner */}
        {scanMode === 'camera' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* HTTPS Notice for Mobile */}
            {window.location.protocol === 'http:' && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium mb-1">{t('barcodeSearch.httpsWarningTitle')}</p>
                    <p>{t('barcodeSearch.httpsWarningDesc')}</p>
                  </div>
                </div>
              </div>
            )}

            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              isActive={isPageActive && scanMode === 'camera'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeSearch;
