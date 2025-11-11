import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-4">About PriceMon</h1>
          <p className="text-white/90 text-lg">
            Your trusted companion for transparent price monitoring
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 space-y-8">
          {/* Mission Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              PriceMon is built on a simple yet powerful idea: everyone deserves access to transparent,
              real-time pricing information for the products they buy every day. In a world where prices
              can vary dramatically between stores and change without notice, we believe consumers should
              be empowered with the knowledge to make informed purchasing decisions. Our platform brings
              together a community of users who contribute and share pricing data, creating a comprehensive
              database that helps everyone save money and shop smarter.
            </p>
          </div>

          {/* Features Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Finding Great Deals</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              With PriceMon, finding the best deals on everyday products has never been easier. Our
              platform aggregates pricing information from multiple stores and locations, allowing you
              to compare prices instantly. Whether you're shopping for groceries, household items, or
              personal care products, you can quickly identify which stores offer the best value. Our
              intelligent price tracking shows you historical trends, helping you understand if you're
              getting a good deal or if it's better to wait. Plus, with our shopping list feature, you
              can plan your purchases strategically across different stores to maximize your savings.
            </p>
          </div>

          {/* Inflation Tracking Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Measure Real Inflation</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              Forget about generic inflation statistics that don't reflect your actual spending. PriceMon
              gives you the power to track inflation that matters to YOU - based on the specific products
              you actually buy. By monitoring the prices of items in your personal shopping list over time,
              you can see exactly how much more (or less) you're spending compared to previous months or
              years. This personalized inflation metric is far more meaningful than broad economic indicators
              because it's based on your real consumption patterns. Understanding your personal inflation
              rate helps you budget more effectively, adjust your spending habits, and advocate for fair
              pricing in your community.
            </p>
          </div>

          {/* Community Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Built by the Community</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              PriceMon thrives thanks to our amazing community of users who contribute pricing data.
              Every price you submit helps your neighbors make better shopping decisions. We've built
              a trust system that rewards accurate contributions and maintains data quality, ensuring
              everyone can rely on the information they see. Together, we're creating transparency in
              retail pricing and putting the power back in the hands of consumers.
            </p>
          </div>

          {/* CTA Section */}
          <div className="pt-8 border-t border-gray-200 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Ready to Start Saving?
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Sign Up Free
              </Link>
              <Link
                to="/how-it-works"
                className="px-8 py-3 bg-white border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50 transition-all"
              >
                Learn How It Works
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
