import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, createPrice, getStores, createStore, getProductPriceHistory, toggleFavorite } from '../../services/productService';
import { verifyPrice, checkUserVotes } from '../../services/userActivityService';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Product, Store, ProductPriceCreateRequest, FieldErrors, PriceHistory } from '../../types';
import PriceHistoryChart from '../../components/common/PriceHistoryChart';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [recentPricesPage, setRecentPricesPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<number, 'positive' | 'negative'>>({});

  // Add Price Modal State
  const [showAddPrice, setShowAddPrice] = useState(false);
  const [priceFormData, setPriceFormData] = useState<ProductPriceCreateRequest>({
    product: parseInt(id || '0'),
    store_id: 0,
    price_entered: '',
    currency_entered: 'BGN',
  });
  const [isPriceSubmitting, setIsPriceSubmitting] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [priceFieldErrors, setPriceFieldErrors] = useState<FieldErrors<ProductPriceCreateRequest>>({});

  // Store search state
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [isStoreSearchFocused, setIsStoreSearchFocused] = useState(false);
  const storeSearchRef = useRef<HTMLDivElement>(null);

  // Load product, stores, and price history
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productData, storesData, historyData] = await Promise.all([
          getProductById(parseInt(id || '0')),
          getStores(),
          getProductPriceHistory(parseInt(id || '0'), chartPeriod),
        ]);
        setProduct(productData);
        setStores(storesData.results);
        setPriceHistory(historyData);

        // Load user votes for all prices
        if (productData.latest_prices && productData.latest_prices.length > 0) {
          const priceIds = productData.latest_prices.map(p => p.id);
          try {
            const votesResponse = await checkUserVotes(priceIds);
            setUserVotes(votesResponse.votes);
          } catch (err) {
            // User not logged in or error checking votes
            console.log('Could not load user votes:', err);
          }
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, chartPeriod]);

  // Initialize filtered stores when modal opens
  useEffect(() => {
    if (showAddPrice) {
      setFilteredStores(stores);
    }
  }, [showAddPrice, stores]);

  // Search stores with debouncing
  useEffect(() => {
    if (!showAddPrice || !storeSearchQuery.trim()) {
      setFilteredStores(stores);
      return;
    }

    const delaySearch = setTimeout(async () => {
      try {
        const response = await getStores({ search: storeSearchQuery });
        setFilteredStores(response.results);
      } catch (err) {
        console.error('Store search error:', err);
        setFilteredStores([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [storeSearchQuery, stores, showAddPrice]);

  // Handle clicking outside store dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeSearchRef.current && !storeSearchRef.current.contains(event.target as Node)) {
        setShowStoreDropdown(false);
      }
    };

    if (showStoreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStoreDropdown]);

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    setStoreSearchQuery(store.name);
    setPriceFormData(prev => ({ ...prev, store_id: store.id }));
    setShowStoreDropdown(false);
    setIsStoreSearchFocused(false);
    if (priceFieldErrors.store_id) {
      setPriceFieldErrors(prev => ({ ...prev, store_id: undefined }));
    }
  };

  const handleCreateNewStore = async () => {
    if (!newStoreName.trim() || !newStoreAddress.trim()) {
      alert('Please enter both store name and address');
      return;
    }

    setIsCreatingStore(true);
    try {
      const newStore = await createStore({
        name: newStoreName.trim(),
        address: newStoreAddress.trim(),
      });

      // Add to stores list and select it
      setStores(prev => [...prev, newStore]);
      handleSelectStore(newStore);
      setShowCreateStore(false);
      setNewStoreName('');
      setNewStoreAddress('');
      alert('Store created successfully!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsCreatingStore(false);
    }
  };

  const handleVerifyPrice = async (priceId: number, voteType: 'positive' | 'negative') => {
    try {
      const result = await verifyPrice(priceId, voteType);
      alert(result.message);

      // Update local state for user votes
      setUserVotes(prev => ({ ...prev, [priceId]: voteType }));

      // Update product state to reflect new vote counts
      if (product) {
        const updatedPrices = product.latest_prices.map(price => {
          if (price.id === priceId) {
            return {
              ...price,
              positive_votes: result.positive_votes,
              negative_votes: result.negative_votes,
            };
          }
          return price;
        });
        setProduct({ ...product, latest_prices: updatedPrices });
      }
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleFavoriteToggle = async () => {
    if (!id) return;
    try {
      const result = await toggleFavorite(parseInt(id));
      setIsFavorite(result.is_favorite);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handlePriceFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPriceFormData((prev) => ({
      ...prev,
      [name]: name === 'store_id' ? parseInt(value) : value,
    }));
    // Clear field error
    if (priceFieldErrors[name as keyof ProductPriceCreateRequest]) {
      setPriceFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const errors: FieldErrors<ProductPriceCreateRequest> = {};
    if (!priceFormData.store_id || priceFormData.store_id === 0) {
      errors.store_id = 'Please select a store';
    }
    if (!priceFormData.price_entered || parseFloat(priceFormData.price_entered) <= 0) {
      errors.price_entered = 'Please enter a valid price';
    }

    if (Object.keys(errors).length > 0) {
      setPriceFieldErrors(errors);
      return;
    }

    setIsPriceSubmitting(true);
    setPriceError('');

    try {
      const response = await createPrice(priceFormData);

      // Only show message if price was flagged as outlier
      if (response.is_flagged) {
        alert('Your price seems unusually high or low compared to other submissions. It will be reviewed by our team before being displayed.');
      }

      setShowAddPrice(false);
      // Reload product and price history to show new price
      const [updatedProduct, updatedHistory] = await Promise.all([
        getProductById(parseInt(id || '0')),
        getProductPriceHistory(parseInt(id || '0')),
      ]);
      setProduct(updatedProduct);
      setPriceHistory(updatedHistory);
      // Reset form
      setPriceFormData({
        product: parseInt(id || '0'),
        store_id: 0,
        price_entered: '',
        currency_entered: 'BGN',
      });
      // Reset store search state
      setStoreSearchQuery('');
      setSelectedStore(null);
      setShowStoreDropdown(false);
      setShowCreateStore(false);
      setNewStoreName('');
      setNewStoreAddress('');
      setIsStoreSearchFocused(false);
    } catch (err) {
      const apiFieldErrors = getFieldErrors(err);
      if (Object.keys(apiFieldErrors).length > 0) {
        setPriceFieldErrors(apiFieldErrors as FieldErrors<ProductPriceCreateRequest>);
      } else {
        setPriceError(getErrorMessage(err));
      }
    } finally {
      setIsPriceSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary mx-auto mb-4"
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
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-6 rounded-lg transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Pending Approval Banner */}
        {product.is_pending && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded-lg">
            <div className="flex items-start gap-2 sm:gap-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-xs sm:text-sm font-semibold text-yellow-900 mb-1">
                  Product Pending Admin Approval
                </h3>
                <p className="text-xs sm:text-sm text-yellow-800">
                  This product is waiting for admin review. You can still add prices and view it, but it won't be visible to other users until it's approved. You earned +5 trust points for adding this product!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Product Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Product Header */}
          <div className="p-4 sm:p-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              {/* Product Image */}
              <div className="flex-shrink-0">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 sm:w-24 sm:h-24 object-contain bg-gray-50 rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      {product.name.trim().split(' ').length >= 2
                        ? (product.name.trim().split(' ')[0][0] + product.name.trim().split(' ')[1][0]).toUpperCase()
                        : product.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 sm:gap-4 mb-1 sm:mb-2">
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>
                  </div>
                  {/* Favorite Button */}
                  <button
                    onClick={handleFavoriteToggle}
                    className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFavorite ? (
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-base sm:text-lg text-gray-600 mb-2 sm:mb-4">{product.brand}</p>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {product.category && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{product.category.icon}</span>
                      <span className="text-gray-600">{product.category.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span className="text-gray-600 font-mono">{product.barcode}</span>
                  </div>
                </div>

                {product.description && (
                  <p className="mt-4 text-gray-700">{product.description}</p>
                )}

                {/* Status Badge */}
                {product.is_pending && (
                  <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Pending Approval
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Best Price */}
          {product.best_price && (
            <div className="p-4 sm:p-6 bg-green-50 border-b border-green-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div>
                  <p className="text-xs sm:text-sm text-green-700 font-medium mb-1">Best Price (Last 30 Days)</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{product.best_price.display_price}</p>
                  <p className="text-xs sm:text-sm text-green-700 mt-1">at {product.best_price.store.name}</p>
                </div>
                <button
                  onClick={() => setShowAddPrice(true)}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Price
                </button>
              </div>
            </div>
          )}

          {/* Price History Chart */}
          {priceHistory && priceHistory.daily_medians.length > 0 && (
            <div className="p-4 sm:p-8 bg-gray-50 border-b border-gray-200">
              <PriceHistoryChart
                dailyMedians={priceHistory.daily_medians}
                allPrices={priceHistory.all_prices}
                currency={product?.best_price?.currency_entered || 'BGN'}
                onPeriodChange={setChartPeriod}
                currentPeriod={chartPeriod}
              />
            </div>
          )}

          {/* Recent Prices */}
          <div className="p-4 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Prices</h2>
              {!product.best_price && (
                <button
                  onClick={() => setShowAddPrice(true)}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Price
                </button>
              )}
            </div>

            {product.latest_prices && product.latest_prices.length > 0 ? (
              <>
                <div className="space-y-4">
                  {product.latest_prices.slice(recentPricesPage * 10, (recentPricesPage + 1) * 10).map((price, index) => {
                  // Calculate trend compared to previous price (if exists)
                  let trend: 'up' | 'down' | 'stable' | null = null;
                  if (index < product.latest_prices!.length - 1) {
                    const prevPrice = product.latest_prices![index + 1];
                    const currentValue = parseFloat(price.price_eur);
                    const prevValue = parseFloat(prevPrice.price_eur);
                    const diff = currentValue - prevValue;

                    if (Math.abs(diff) < 0.1) {
                      trend = 'stable';
                    } else if (diff > 0) {
                      trend = 'up';
                    } else {
                      trend = 'down';
                    }
                  }

                  return (
                    <div
                      key={price.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: price.store.primary_color }}
                        >
                          {price.store.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{price.store.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(price.created_at).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-gray-900">{price.display_price}</p>
                          {trend && (
                            <div className="flex items-center">
                              {trend === 'up' && (
                                <div className="flex items-center text-red-600" title="Price increased">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </div>
                              )}
                              {trend === 'down' && (
                                <div className="flex items-center text-green-600" title="Price decreased">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              )}
                              {trend === 'stable' && (
                                <div className="flex items-center text-gray-600" title="Price stable">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {/* Check if current user submitted this price */}
                          {user && price.submitted_by === user.id ? (
                            /* Show only vote counts for user's own prices */
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200">
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
                              <span className="text-xs text-gray-500 italic">Your price</span>
                            </div>
                          ) : (
                            /* Show vote buttons for other users' prices */
                            <>
                              <div className="flex items-center gap-2">
                                {/* Positive Vote Button */}
                                <button
                                  onClick={() => handleVerifyPrice(price.id, 'positive')}
                                  disabled={!!userVotes[price.id]}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                                    userVotes[price.id] === 'positive'
                                      ? 'bg-green-100 text-green-700 border border-green-300'
                                      : userVotes[price.id]
                                      ? 'opacity-50 cursor-not-allowed text-gray-400'
                                      : 'hover:bg-green-50 text-green-600 border border-gray-200'
                                  }`}
                                  title="Vote that this price is accurate"
                                >
                                  <svg className="w-4 h-4" fill={userVotes[price.id] === 'positive' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                  </svg>
                                  <span>{price.positive_votes}</span>
                                </button>

                                {/* Negative Vote Button */}
                                <button
                                  onClick={() => handleVerifyPrice(price.id, 'negative')}
                                  disabled={!!userVotes[price.id]}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                                    userVotes[price.id] === 'negative'
                                      ? 'bg-red-100 text-red-700 border border-red-300'
                                      : userVotes[price.id]
                                      ? 'opacity-50 cursor-not-allowed text-gray-400'
                                      : 'hover:bg-red-50 text-red-600 border border-gray-200'
                                  }`}
                                  title="Vote that this price is not accurate"
                                >
                                  <svg className="w-4 h-4" fill={userVotes[price.id] === 'negative' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                  </svg>
                                  <span>{price.negative_votes}</span>
                                </button>
                              </div>

                              {/* Total votes */}
                              <span className="text-xs text-gray-500">
                                {price.positive_votes + price.negative_votes} {price.positive_votes + price.negative_votes === 1 ? 'vote' : 'votes'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>

                {/* Pagination */}
                {product.latest_prices.length > 10 && (
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setRecentPricesPage(prev => Math.max(0, prev - 1))}
                      disabled={recentPricesPage === 0}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {recentPricesPage + 1} of {Math.ceil(product.latest_prices.length / 10)}
                    </span>
                    <button
                      onClick={() => setRecentPricesPage(prev => Math.min(Math.ceil(product.latest_prices.length / 10) - 1, prev + 1))}
                      disabled={recentPricesPage >= Math.ceil(product.latest_prices.length / 10) - 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-500 mb-4">No prices yet for this product</p>
                <button
                  onClick={() => setShowAddPrice(true)}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Be the first to add a price
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Price Modal */}
      {showAddPrice && (
        <div className={`fixed inset-0 bg-black/50 flex ${isStoreSearchFocused ? 'items-start pt-4 sm:pt-8' : 'items-center'} justify-center p-4 z-50 overflow-y-auto`}>
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-8 my-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Add New Price</h3>

            <form onSubmit={handleAddPrice} className="space-y-3 sm:space-y-4">
              {priceError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {priceError}
                </div>
              )}

              {/* Store Selection */}
              <div ref={storeSearchRef}>
                <label htmlFor="store_search" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Store <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="store_search"
                    type="text"
                    value={storeSearchQuery}
                    onChange={(e) => {
                      setStoreSearchQuery(e.target.value);
                      setShowStoreDropdown(true);
                      setShowCreateStore(false);
                    }}
                    onFocus={() => {
                      setShowStoreDropdown(true);
                      setIsStoreSearchFocused(true);
                    }}
                    onBlur={() => {
                      // Delay to allow click on dropdown items
                      setTimeout(() => setIsStoreSearchFocused(false), 200);
                    }}
                    placeholder="Search for a store..."
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border ${
                      priceFieldErrors.store_id ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                    disabled={isPriceSubmitting}
                    autoComplete="off"
                  />
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>

                  {/* Store Dropdown */}
                  {showStoreDropdown && !showCreateStore && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredStores.length > 0 ? (
                        <>
                          {filteredStores.map((store) => (
                            <button
                              key={store.id}
                              type="button"
                              onClick={() => handleSelectStore(store)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <p className="font-medium text-gray-900">{store.name}</p>
                              {store.address && <p className="text-sm text-gray-500">{store.address}</p>}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreateStore(true);
                              setShowStoreDropdown(false);
                              setNewStoreName(storeSearchQuery);
                            }}
                            className="w-full text-left px-4 py-3 bg-primary-50 hover:bg-primary-100 transition-colors text-primary font-medium flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create new store
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateStore(true);
                            setShowStoreDropdown(false);
                            setNewStoreName(storeSearchQuery);
                          }}
                          className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <p className="font-medium">No stores found</p>
                          <p className="text-sm text-primary">Click to create new store</p>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {priceFieldErrors.store_id && (
                  <p className="mt-1 text-sm text-red-600">{priceFieldErrors.store_id}</p>
                )}

                {/* Selected Store Display */}
                {selectedStore && !showStoreDropdown && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900">{selectedStore.name}</p>
                      {selectedStore.address && <p className="text-sm text-green-700">{selectedStore.address}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStore(null);
                        setStoreSearchQuery('');
                        setPriceFormData(prev => ({ ...prev, store_id: 0 }));
                      }}
                      className="text-green-700 hover:text-green-900"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Create New Store Form */}
              {showCreateStore && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Create New Store</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateStore(false);
                        setNewStoreName('');
                        setNewStoreAddress('');
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      placeholder="e.g., Kaufland Sofia Mall"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={isCreatingStore}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStoreAddress}
                      onChange={(e) => setNewStoreAddress(e.target.value)}
                      placeholder="e.g., Sofia Mall, Tsarigradsko shose 115"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={isCreatingStore}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateNewStore}
                    disabled={isCreatingStore || !newStoreName.trim() || !newStoreAddress.trim()}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingStore ? 'Creating...' : 'Create Store'}
                  </button>
                </div>
              )}

              {/* Price */}
              <div>
                <label htmlFor="price_entered" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  id="price_entered"
                  name="price_entered"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceFormData.price_entered}
                  onChange={handlePriceFormChange}
                  placeholder="0.00"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border ${
                    priceFieldErrors.price_entered ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                  disabled={isPriceSubmitting}
                  required
                />
                {priceFieldErrors.price_entered && (
                  <p className="mt-1 text-sm text-red-600">{priceFieldErrors.price_entered}</p>
                )}
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="currency_entered" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Currency
                </label>
                <select
                  id="currency_entered"
                  name="currency_entered"
                  value={priceFormData.currency_entered}
                  onChange={handlePriceFormChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  disabled={isPriceSubmitting}
                >
                  <option value="BGN">BGN (лв)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 sm:gap-4 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPrice(false);
                    setPriceError('');
                    setPriceFieldErrors({});
                    setStoreSearchQuery('');
                    setSelectedStore(null);
                    setShowStoreDropdown(false);
                    setShowCreateStore(false);
                    setNewStoreName('');
                    setNewStoreAddress('');
                    setIsStoreSearchFocused(false);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 sm:py-3 text-sm sm:text-base rounded-lg transition-all"
                  disabled={isPriceSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPriceSubmitting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2 sm:py-3 text-sm sm:text-base rounded-lg transition-all disabled:opacity-50"
                >
                  {isPriceSubmitting ? 'Adding...' : 'Add Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
