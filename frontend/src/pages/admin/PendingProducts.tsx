import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingProducts, approveProduct, rejectProduct, type PendingProductWithSubmitter } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';

const PendingProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<PendingProductWithSubmitter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getPendingProducts();
      setProducts(data.results);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (productId: number) => {
    if (!confirm('Are you sure you want to approve this product?')) return;

    setProcessingId(productId);
    try {
      const result = await approveProduct(productId);
      alert(result.message);
      // Remove from list
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (productId: number) => {
    if (!confirm('Are you sure you want to reject this product? This action cannot be undone.')) return;

    setProcessingId(productId);
    try {
      const result = await rejectProduct(productId);
      alert(result.message);
      // Remove from list
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'Gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Silver': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'Bronze': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Pending Products</h1>
          <p className="text-gray-600 mt-2">Review and approve product submissions</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Products List */}
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Products</h3>
            <p className="text-gray-600">All product submissions have been reviewed!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-24 h-24 object-contain bg-gray-50 rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">
                            {product.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                          <p className="text-gray-600">{product.brand}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Barcode</p>
                          <p className="text-sm font-mono font-semibold text-gray-900">{product.barcode}</p>
                        </div>
                        {product.category && (
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Category</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {product.category.icon} {product.category.name}
                            </p>
                          </div>
                        )}
                        {product.description && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-500 mb-1">Description</p>
                            <p className="text-sm text-gray-700">{product.description}</p>
                          </div>
                        )}
                      </div>

                      {/* Submitter Info */}
                      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-4">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Submitted by</p>
                          <p className="text-sm font-semibold text-gray-900">{product.created_by_email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Trust Score</p>
                          <p className="text-sm font-bold text-gray-900">{product.creator_trust_score} points</p>
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTrustLevelColor(product.creator_trust_level)}`}>
                            {product.creator_trust_level}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Submitted</p>
                          <p className="text-sm text-gray-700">{new Date(product.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(product.id)}
                          disabled={processingId === product.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {processingId === product.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(product.id)}
                          disabled={processingId === product.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {processingId === product.id ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingProducts;
