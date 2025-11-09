import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DailyMedian, ProductPrice } from '../../types';
import { format, parseISO, eachDayOfInterval, subDays, startOfDay } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PriceHistoryChartProps {
  dailyMedians: DailyMedian[];
  allPrices: ProductPrice[];
  currency?: 'BGN' | 'EUR';
  onPeriodChange?: (period: 'week' | 'month' | 'all') => void;
  currentPeriod?: 'week' | 'month' | 'all';
  className?: string;
}

const PriceHistoryChart = ({
  dailyMedians: _dailyMedians,
  allPrices,
  currency = 'BGN',
  onPeriodChange,
  currentPeriod = 'all',
  className = ''
}: PriceHistoryChartProps) => {
  const symbol = currency === 'BGN' ? 'лв' : '€';
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | null>(null);

  // Convert price to display currency
  // Use the original entered price when possible to avoid precision loss from double conversion
  const convertPrice = (price: ProductPrice) => {
    const enteredPrice = parseFloat(price.price_entered);

    // If the entered currency matches the display currency, use the original value
    if (price.currency_entered === currency) {
      return enteredPrice;
    }

    // Otherwise, convert between currencies
    if (currency === 'BGN' && price.currency_entered === 'EUR') {
      return enteredPrice * 1.95583; // EUR to BGN
    } else if (currency === 'EUR' && price.currency_entered === 'BGN') {
      return enteredPrice / 1.95583; // BGN to EUR
    }

    return enteredPrice;
  };

  // Generate date range based on period
  let dateRange: Date[];
  const today = startOfDay(new Date());

  if (currentPeriod === 'week') {
    const weekAgo = subDays(today, 6); // 7 days including today
    dateRange = eachDayOfInterval({ start: weekAgo, end: today });
  } else if (currentPeriod === 'month') {
    const monthAgo = subDays(today, 29); // 30 days including today
    dateRange = eachDayOfInterval({ start: monthAgo, end: today });
  } else {
    // 'all' - from first price to today
    if (allPrices.length > 0) {
      const firstPriceDate = startOfDay(parseISO(allPrices[0].created_at));
      dateRange = eachDayOfInterval({ start: firstPriceDate, end: today });
    } else {
      dateRange = [today];
    }
  }

  // Create labels for x-axis
  const labels = dateRange.map(date => format(date, 'MMM dd'));

  // Map prices to their date index with time-based positioning
  const priceData = allPrices.map((price, idx) => {
    const priceDateTime = parseISO(price.created_at);
    const priceDate = startOfDay(priceDateTime);
    const dateIndex = dateRange.findIndex(d => d.getTime() === priceDate.getTime());

    if (dateIndex === -1) return null;

    // Calculate fractional position within the day based on time
    // A price at 00:00 → 0.0, at 12:00 → 0.5, at 18:00 → 0.75, at 23:59 → ~1.0
    const hours = priceDateTime.getHours();
    const minutes = priceDateTime.getMinutes();
    const seconds = priceDateTime.getSeconds();
    const totalSecondsInDay = 24 * 60 * 60;
    const secondsFromStartOfDay = hours * 3600 + minutes * 60 + seconds;
    const dayFraction = secondsFromStartOfDay / totalSecondsInDay;

    return {
      x: dateIndex + dayFraction, // Position dot based on exact time
      y: convertPrice(price),
      storeName: price.store.name,
      date: format(parseISO(price.created_at), 'MMM dd, yyyy HH:mm'),
      priceIndex: idx // Store original index to find the price object
    };
  }).filter(d => d !== null);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Prices',
        data: priceData,
        borderColor: 'transparent',
        backgroundColor: '#DC143C',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: 'circle',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        showLine: false, // No lines, only dots
      }
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event, elements) => {
      if (elements.length > 0) {
        const dataIndex = elements[0].index;
        const dataPoint = priceData[dataIndex] as any;
        if (dataPoint && dataPoint.priceIndex !== undefined) {
          setSelectedPrice(allPrices[dataPoint.priceIndex]);
        }
      }
    },
    plugins: {
      legend: {
        display: false, // Hide legend since we only have dots
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: false, // Disable hover tooltip since we have click popup
      },
    },
    scales: {
      x: {
        type: 'linear',
        min: 0,
        max: labels.length, // Add +1 day for visual spacing
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
          // Show fewer labels on long time ranges
          maxTicksLimit: currentPeriod === 'all' ? 15 : undefined,
          // Map integer ticks to date labels
          callback: function(value) {
            const index = Math.round(Number(value));
            return labels[index] || '';
          },
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => {
            return `${Number(value).toFixed(2)} ${symbol}`;
          },
        },
      },
    },
    interaction: {
      mode: 'point',
      intersect: true,
    },
  };

  // Calculate statistics from all prices
  const priceValues = allPrices.map(p => convertPrice(p));
  const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;
  const maxPrice = priceValues.length > 0 ? Math.max(...priceValues) : 0;
  const avgPrice = priceValues.length > 0 ? priceValues.reduce((a, b) => a + b, 0) / priceValues.length : 0;

  // Determine trend (oldest to newest)
  let isIncreasing = false;
  let isStable = true;
  let priceChange = '0.0';

  if (priceValues.length >= 2) {
    const firstPrice = priceValues[0];
    const lastPrice = priceValues[priceValues.length - 1];
    const priceDiff = lastPrice - firstPrice;
    priceChange = ((priceDiff / firstPrice) * 100).toFixed(1);
    isIncreasing = priceDiff > 0;
    isStable = Math.abs(priceDiff) < 0.5;
  }

  if (allPrices.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No price history available for this period</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Period Selector */}
      {onPeriodChange && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Price History</h3>
          <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              onClick={() => onPeriodChange('week')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                currentPeriod === 'week'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => onPeriodChange('month')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                currentPeriod === 'month'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => onPeriodChange('all')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                currentPeriod === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200">
        <div className="h-64 sm:h-96" style={{ cursor: 'pointer' }}>
          <Line data={chartData} options={options} />
        </div>
      </div>

      {/* Price Detail Popup */}
      {selectedPrice && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPrice(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Price Details</h3>
              <button
                onClick={() => setSelectedPrice(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Price */}
            <div className="mb-6 text-center py-4 bg-primary-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Price</div>
              <div className="text-4xl font-bold text-primary">
                {convertPrice(selectedPrice).toFixed(2)} {symbol}
              </div>
            </div>

            {/* Store Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: selectedPrice.store.primary_color }}>
                  {selectedPrice.store.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Store</div>
                  <div className="font-semibold text-gray-900">{selectedPrice.store.name}</div>
                </div>
              </div>

              {(selectedPrice.store.address || selectedPrice.store.city) && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Location</div>
                    <div className="font-medium text-gray-900">
                      {selectedPrice.store.address && <div>{selectedPrice.store.address}</div>}
                      {selectedPrice.store.city && <div className="text-sm text-gray-600 mt-0.5">{selectedPrice.store.city}</div>}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Submitted</div>
                  <div className="font-medium text-gray-900">
                    {format(parseISO(selectedPrice.created_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedPrice(null)}
              className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-3 sm:mt-4">
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Lowest Price</div>
          <div className="text-base sm:text-xl font-bold text-green-600">
            {minPrice.toFixed(2)} {symbol}
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Highest Price</div>
          <div className="text-base sm:text-xl font-bold text-red-600">
            {maxPrice.toFixed(2)} {symbol}
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Average Price</div>
          <div className="text-base sm:text-xl font-bold text-blue-600">
            {avgPrice.toFixed(2)} {symbol}
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Price Trend</div>
          <div
            className={`text-base sm:text-xl font-bold flex items-center gap-1 ${
              isStable ? 'text-gray-600' : isIncreasing ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {isStable ? (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
                Stable
              </>
            ) : isIncreasing ? (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                +{priceChange}%
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {priceChange}%
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceHistoryChart;
