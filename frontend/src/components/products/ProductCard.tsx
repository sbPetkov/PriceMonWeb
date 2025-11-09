import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { ProductList } from '../../types';

interface ProductCardProps {
  product: ProductList;
  onFavoriteToggle?: (productId: number) => void;
  isFavorite?: boolean;
}

const ProductCard = ({ product, onFavoriteToggle, isFavorite = false }: ProductCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper function to convert price to user's preferred currency
  const convertToPreferredCurrency = (priceEntered: string, currencyEntered: 'BGN' | 'EUR'): string => {
    const preferredCurrency = user?.preferred_currency || 'BGN';
    const price = parseFloat(priceEntered);

    // If currencies match, return as-is
    if (currencyEntered === preferredCurrency) {
      return `${price.toFixed(2)} ${preferredCurrency}`;
    }

    // Convert between currencies
    const BGN_TO_EUR_RATE = 1.95583;
    if (preferredCurrency === 'BGN' && currencyEntered === 'EUR') {
      return `${(price * BGN_TO_EUR_RATE).toFixed(2)} BGN`;
    } else if (preferredCurrency === 'EUR' && currencyEntered === 'BGN') {
      return `${(price / BGN_TO_EUR_RATE).toFixed(2)} EUR`;
    }

    return `${price.toFixed(2)} ${currencyEntered}`;
  };

  // Get 2-letter abbreviation from product name
  const getAbbreviation = (name: string) => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(product.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group border border-gray-100"
    >
      <div className="p-4">
        {/* Header with Image/Abbreviation and Favorite */}
        <div className="flex items-start gap-3 mb-3">
          {/* Product Image or Abbreviation */}
          <div className="flex-shrink-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-16 h-16 object-contain bg-gray-50 rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {getAbbreviation(product.name)}
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{product.brand}</p>
          </div>

          {/* Favorite Button */}
          {onFavoriteToggle && (
            <button
              onClick={handleFavoriteClick}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isFavorite ? (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Category */}
        {product.category_name && (
          <div className="text-xs text-gray-500 mb-2">
            {product.category_name}
          </div>
        )}

        {/* Best Price */}
        {product.best_price ? (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Best Price</p>
              <p className="text-lg font-bold text-green-600">
                {convertToPreferredCurrency(product.best_price.price_entered, product.best_price.currency_entered)}
              </p>
            </div>
            <div className="text-xs text-gray-500 text-right">
              {product.best_price.store}
            </div>
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-400 text-center">No prices yet</p>
          </div>
        )}

        {/* Status Badge */}
        {product.status === 'pending' && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pending Approval
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
