import { Link } from 'react-router-dom';

const AuthFooter = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              to="/about"
              className="text-gray-600 hover:text-primary font-medium transition-colors"
            >
              About
            </Link>
            <Link
              to="/how-it-works"
              className="text-gray-600 hover:text-primary font-medium transition-colors"
            >
              How It Works
            </Link>
            <Link
              to="/install"
              className="text-gray-600 hover:text-primary font-medium transition-colors"
            >
              Install App
            </Link>
            <Link
              to="/contact"
              className="text-gray-600 hover:text-primary font-medium transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Divider */}
          <div className="w-full max-w-xs h-px bg-gray-200"></div>

          {/* Copyright */}
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} PriceMon. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;
