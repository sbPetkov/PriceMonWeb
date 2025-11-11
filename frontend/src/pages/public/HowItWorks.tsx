import { Link } from 'react-router-dom';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: 'Sign Up & Verify Your Email',
      description:
        'Create your free PriceMon account in seconds. After signing up, verify your email address to unlock all features. Email verification helps us maintain a trusted community and ensures you receive important notifications about price changes and updates.',
      image: 'step1-signup.jpg',
      color: 'from-blue-500 to-blue-600',
    },
    {
      number: 2,
      title: 'Search for Products',
      description:
        'Use the powerful search feature to find any product you\'re interested in. Our database contains thousands of everyday items from groceries to household goods. Filter by category, store, or location to narrow down results. Can\'t find a product? You can add it yourself and help the community!',
      image: 'step2-search.jpg',
      color: 'from-green-500 to-green-600',
    },
    {
      number: 3,
      title: 'Scan Products',
      description:
        'Submit price information in multiple ways for maximum convenience. Manually enter product prices, locations, and store details, or use your phone\'s camera to scan barcodes for instant product recognition. Our smart system validates submissions to ensure data accuracy and quality.',
      image: 'step3-scan.jpg',
      color: 'from-purple-500 to-purple-600',
    },
    {
      number: 4,
      title: 'View Product Details',
      description:
        'Explore comprehensive pricing information for each product. See the current average price across all stores, identify the lowest available price, and view which stores carry the item. The interactive price history graph shows trends over time, helping you spot the best time to buy and understand seasonal variations.',
      image: 'step4-details.jpg',
      color: 'from-orange-500 to-orange-600',
    },
    {
      number: 5,
      title: 'Create Shopping Lists',
      description:
        'Organize your purchases with smart shopping lists. Add items you need and share lists with family members or roommates so everyone can contribute. Our comparison feature analyzes your entire list and shows you which stores offer the best overall value, helping you save time and money on every shopping trip.',
      image: 'step5-list.jpg',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-600 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-4">How PriceMon Works</h1>
          <p className="text-white/90 text-lg">
            Your step-by-step guide to smarter shopping
          </p>
        </div>
      </div>

      {/* Tutorial Steps */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                index % 2 === 0 ? '' : ''
              }`}
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Image Section */}
                <div
                  className={`${
                    index % 2 === 0 ? 'md:order-1' : 'md:order-2'
                  } relative`}
                >
                  <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden rounded-l-2xl">
                    <img
                      src={`/images/tutorial/${step.image}`}
                      alt={step.title}
                      className="w-auto h-auto max-w-full max-h-full object-contain p-4"
                    />
                    <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-xl font-bold text-white">
                        {step.number}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div
                  className={`${
                    index % 2 === 0 ? 'md:order-2' : 'md:order-1'
                  } p-8 sm:p-12 flex flex-col justify-center`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${step.color} rounded-lg mb-4`}
                  >
                    <span className="text-xl font-bold text-white">
                      {step.number}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h2>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 sm:p-12 border-2 border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Pro Tips for Better Results
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                Submit Accurate Prices
              </h3>
              <p className="text-gray-600 text-sm">
                Always double-check prices before submitting. Accurate data
                helps everyone and increases your trust score!
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                Build Your Trust Score
              </h3>
              <p className="text-gray-600 text-sm">
                Regular contributions and quality submissions earn you trust
                points. Reach 100+ to auto-approve your products!
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                Share with Friends
              </h3>
              <p className="text-gray-600 text-sm">
                Invite friends and family to join. Shared lists make shopping
                easier and help build a better database!
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-white rounded-2xl shadow-lg p-8 sm:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of smart shoppers who are saving money every day with
            PriceMon. It's completely free!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-primary to-primary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
            >
              Create Free Account
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 bg-white border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50 transition-all text-lg"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
