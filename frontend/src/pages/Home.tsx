import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFavorites, toggleFavorite, getProducts } from '../services/productService';
import { getErrorMessage } from '../services/api';
import type { ProductList } from '../types';
import ProductCard from '../components/products/ProductCard';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<ProductList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTrustInfoModal, setShowTrustInfoModal] = useState(false);

  // Search modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductList[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const data = await getFavorites();
        setFavorites(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const handleFavoriteToggle = async (productId: number) => {
    try {
      const result = await toggleFavorite(productId);
      if (!result.is_favorite) {
        // Remove from favorites list
        setFavorites((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Search functionality with debouncing
  useEffect(() => {
    if (!showSearchModal) {
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await getProducts({ search: searchQuery });
        setSearchResults(response.results);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(delaySearch);
  }, [searchQuery, showSearchModal]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Message */}
        <div className="card mb-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                Welcome back, {user?.first_name || user?.username}!
              </h2>
              <p className="text-text-secondary">
                Ready to track prices and save money?
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              <div className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium">
                {user?.trust_level} Member
              </div>
              <div className="text-xl">
                {user?.trust_level === 'Gold' && '🥇'}
                {user?.trust_level === 'Silver' && '🥈'}
                {user?.trust_level === 'Bronze' && '🥉'}
              </div>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {user?.trust_score}
              </div>
              <div className="text-sm text-text-secondary mt-1 flex items-center justify-center gap-1">
                Trust Score
                <button
                  onClick={() => setShowTrustInfoModal(true)}
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                  title="Learn about Trust Score"
                >
                  <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-secondary">
                {user?.total_products_added}
              </div>
              <div className="text-sm text-text-secondary mt-1">
                Products Added
              </div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {user?.total_prices_added}
              </div>
              <div className="text-sm text-text-secondary mt-1">
                Prices Submitted
              </div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-xl">{user?.preferred_currency}</div>
              <div className="text-sm text-text-secondary mt-1">
                Currency
              </div>
            </div>
          </div>
        </div>

        {/* Favorite Products */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Favorite Products</h2>
            <button
              onClick={() => setShowSearchModal(true)}
              className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Products
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-500">Loading favorites...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-600">{error}</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Favorites Yet</h3>
              <p className="text-gray-500 mb-4">Start adding products to your favorites for quick access</p>
              <button
                onClick={() => setShowSearchModal(true)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-6 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favorites.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorite={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Coming Soon Notice */}
        <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-dashed border-primary-200">
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              More Features Coming Soon! 🚀
            </h3>
            <p className="text-text-secondary">
              Phase 2 in progress! Thank you for your patience.
            </p>
          </div>
        </div>
      </main>

      {/* Search Modal */}
      {showSearchModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Search Input */}
            <div className="bg-gradient-to-r from-primary to-primary/90 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Search Products</h2>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by product name, brand, or barcode..."
                  className="w-full px-4 py-3 pl-12 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                  autoFocus
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {!searchQuery.trim() ? (
                // Empty State
                <div className="text-center py-16">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Searching</h3>
                  <p className="text-gray-500">
                    Type a product name, brand, or barcode to find products
                  </p>
                </div>
              ) : isSearching ? (
                // Loading State
                <div className="text-center py-16">
                  <svg className="animate-spin h-12 w-12 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-4 text-gray-500">Searching...</p>
                </div>
              ) : searchResults.length === 0 ? (
                // No Results State
                <div className="text-center py-16">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
                  <p className="text-gray-500 mb-4">
                    We couldn't find any products matching "{searchQuery}"
                  </p>
                  <button
                    onClick={() => navigate('/products/barcode')}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-6 rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Product
                  </button>
                </div>
              ) : (
                // Search Results Grid
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((product) => (
                      <div key={product.id} onClick={() => {
                        setShowSearchModal(false);
                        navigate(`/products/${product.id}`);
                      }}>
                        <ProductCard
                          product={product}
                          onFavoriteToggle={handleFavoriteToggle}
                          isFavorite={product.is_favorite}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trust Score Info Modal */}
      {showTrustInfoModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTrustInfoModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary to-primary/90 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Trust Score System</h2>
                    <p className="text-white/80 text-sm">How to earn and maintain your reputation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTrustInfoModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Earn Points Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  How to Earn Trust Points
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-green-600">+5</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Add a Product</p>
                      <p className="text-sm text-gray-600">Contribute by adding new products to our database</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-green-600">+3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Submit a Price</p>
                      <p className="text-sm text-gray-600">Help others by adding current prices from stores</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-green-600">+1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Vote on Prices</p>
                      <p className="text-sm text-gray-600">Verify accuracy of prices submitted by others (positive or negative)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Penalties Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Penalties for Inaccurate Data
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-red-600">-20</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Rejected Price by Admin</p>
                      <p className="text-sm text-gray-600">If your price receives 3+ negative votes and admin confirms it's wrong</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Levels Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Trust Levels & Benefits
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-2xl">🥉</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">Bronze (0-49 points)</p>
                      </div>
                      <p className="text-sm text-gray-600">Your submissions require admin approval</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-300">
                    <div className="text-2xl">🥈</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">Silver (50-99 points)</p>
                      </div>
                      <p className="text-sm text-gray-600">Your prices are auto-approved!</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                    <div className="text-2xl">🥇</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">Gold (100+ points)</p>
                      </div>
                      <p className="text-sm text-gray-600">Both products and prices are auto-approved! Maximum trust.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Pro Tips</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Always double-check prices before submitting</li>
                      <li>• Vote honestly on prices to help the community</li>
                      <li>• Reach Silver level to get auto-approved prices</li>
                      <li>• Quality over quantity - accurate data builds trust</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowTrustInfoModal(false)}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
