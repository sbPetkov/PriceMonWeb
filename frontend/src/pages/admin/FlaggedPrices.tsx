import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFlaggedPrices, approvePrice, rejectPrice, type FlaggedPriceWithSubmitter } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';

const FlaggedPrices = () => {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<FlaggedPriceWithSubmitter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadFlaggedPrices();
  }, []);

  const loadFlaggedPrices = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getFlaggedPrices();
      setPrices(data.results);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (priceId: number) => {
    if (!confirm('Approve this price? Negative votes will be reset to 0.')) return;

    setProcessingId(priceId);
    try {
      const result = await approvePrice(priceId);
      alert(result.message);
      // Remove from list
      setPrices(prev => prev.filter(p => p.id !== priceId));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (priceId: number) => {
    if (!confirm('Reject this price? The submitter will lose 20 trust points. This action cannot be undone.')) return;

    setProcessingId(priceId);
    try {
      const result = await rejectPrice(priceId);
      alert(result.message);
      // Remove from list
      setPrices(prev => prev.filter(p => p.id !== priceId));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const getTrustLevelColor = (level: string | null) => {
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
          <p className="text-gray-600">Loading flagged prices...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Flagged Prices</h1>
          <p className="text-gray-600 mt-2">Prices with 3+ negative votes requiring review</p>
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

        {/* Prices List */}
        {prices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Flagged Prices</h3>
            <p className="text-gray-600">All prices are within community standards!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prices.map((price) => (
              <div
                key={price.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Store Badge */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-24 h-24 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: price.store.primary_color }}
                      >
                        {price.store.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>

                    {/* Price Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{price.product_name}</h3>
                          <p className="text-gray-600">{price.product_brand}</p>
                        </div>
                        {/* Vote Counts */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-md border border-red-200">
                          <div className="flex items-center gap-1 text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span className="text-xs font-semibold">{price.positive_votes}</span>
                          </div>
                          <span className="text-gray-300">|</span>
                          <div className="flex items-center gap-1 text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                            <span className="text-xs font-semibold">{price.negative_votes}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Price</p>
                          <p className="text-2xl font-bold text-gray-900">{price.display_price}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Store</p>
                          <p className="text-sm font-semibold text-gray-900">{price.store.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Submitted</p>
                          <p className="text-sm text-gray-700">{new Date(price.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Submitter Info */}
                      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-4">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Submitted by</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {price.submitted_by_email || 'Unknown'}
                          </p>
                        </div>
                        {price.submitter_trust_score !== null && (
                          <>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Trust Score</p>
                              <p className="text-sm font-bold text-gray-900">{price.submitter_trust_score} points</p>
                            </div>
                            <div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTrustLevelColor(price.submitter_trust_level)}`}>
                                {price.submitter_trust_level}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Warning Message */}
                      <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Warning:</strong> This price has received {price.negative_votes} negative votes from the community.
                          {price.submitter_trust_score !== null && (
                            <> Rejecting will penalize the submitter with -20 trust points (current: {price.submitter_trust_score}).</>
                          )}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(price.id)}
                          disabled={processingId === price.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {processingId === price.id ? 'Approving...' : 'Approve (Reset Votes)'}
                        </button>
                        <button
                          onClick={() => handleReject(price.id)}
                          disabled={processingId === price.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {processingId === price.id ? 'Rejecting...' : 'Reject (-20 Points)'}
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

export default FlaggedPrices;
