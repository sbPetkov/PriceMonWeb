import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const InstallApp = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstalled, setShowInstalled] = useState(false);

  useEffect(() => {
    // Listen for install prompt (Android/Chrome)
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      setShowInstalled(true);
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Install PriceMon
            </h1>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Install PriceMon on your device for a faster, native app experience. Access it anytime from your home screen!
            </p>
          </div>
        </div>

        {/* Already Installed Notice */}
        {showInstalled && (
          <div className="card mb-6 bg-green-50 border-2 border-green-200">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-green-900 mb-1">App Already Installed!</h3>
                <p className="text-sm text-green-800">PriceMon is installed on your device. You're already enjoying the full app experience!</p>
              </div>
            </div>
          </div>
        )}

        {/* Android/Chrome Install Button */}
        {isInstallable && !showInstalled && (
          <div className="card mb-6 bg-primary/5 border-2 border-primary">
            <div className="text-center">
              <h3 className="text-xl font-bold text-text-primary mb-3">
                Ready to Install!
              </h3>
              <p className="text-text-secondary mb-4">
                Your browser supports one-click installation. Click below to add PriceMon to your home screen.
              </p>
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Install PriceMon Now
              </button>
            </div>
          </div>
        )}

        {/* Benefits Section */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">Why Install?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Faster Performance</h3>
                <p className="text-sm text-text-secondary">Optimized app experience with instant loading</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Full Screen Mode</h3>
                <p className="text-sm text-text-secondary">No browser UI - more space for scanning</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Home Screen Access</h3>
                <p className="text-sm text-text-secondary">Launch directly like a native app</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Better Privacy</h3>
                <p className="text-sm text-text-secondary">Isolated from browser history and cookies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform-Specific Instructions */}
        <div className="space-y-6">
          {/* iOS/Safari Instructions */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">iPhone / iPad (Safari)</h2>
                <p className="text-sm text-text-secondary">Most common for iOS users</p>
              </div>
            </div>

            <ol className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                <div>
                  <p className="font-medium text-text-primary">Tap the Share button</p>
                  <p className="text-sm">Look for the <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/></svg> icon at the bottom of Safari</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                <div>
                  <p className="font-medium text-text-primary">Select "Add to Home Screen"</p>
                  <p className="text-sm">Scroll down and tap the option with a <span className="font-bold">+</span> icon</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                <div>
                  <p className="font-medium text-text-primary">Confirm and Install</p>
                  <p className="text-sm">The app name will be "PriceMon" - tap "Add" to finish</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">✓</div>
                <div>
                  <p className="font-medium text-text-primary">Done! Find the app on your home screen</p>
                  <p className="text-sm">PriceMon will now open full-screen like a native app</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Android Chrome Instructions */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.8 5.16h4.7l2.26 3.87L6.5 5.16h4.7L8.94 9.03z"/>
                  <path d="M6.5 18.84l-2.26-3.87 2.26-3.9 2.26 3.9z"/>
                  <path d="M22.2 18.84h-4.7l-2.26-3.87 2.26-3.9h-4.7l2.26 3.9z"/>
                  <path d="M17.5 5.16l2.26 3.87-2.26 3.9-2.26-3.9z"/>
                  <circle cx="12" cy="12" r="2.5"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Android (Chrome)</h2>
                <p className="text-sm text-text-secondary">Easiest installation method</p>
              </div>
            </div>

            <ol className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                <div>
                  <p className="font-medium text-text-primary">Look for the install banner</p>
                  <p className="text-sm">Chrome will show an "Install PriceMon" banner at the bottom of the screen</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                <div>
                  <p className="font-medium text-text-primary">Tap "Install"</p>
                  <p className="text-sm">Or tap the menu (⋮) → "Add to Home screen" / "Install app"</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">✓</div>
                <div>
                  <p className="font-medium text-text-primary">Done! Open from your app drawer</p>
                  <p className="text-sm">PriceMon appears alongside your other apps</p>
                </div>
              </li>
            </ol>

            {isInstallable && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 mb-2 font-medium">You can install right now:</p>
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  Install PriceMon
                </button>
              </div>
            )}
          </div>

          {/* Firefox Instructions */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 15.734c-1.158 1.566-3.044 2.532-5.181 2.532-1.819 0-3.48-.754-4.657-1.969a6.59 6.59 0 01-1.657-4.297c0-3.657 2.97-6.627 6.627-6.627 1.819 0 3.48.754 4.657 1.969.524.54.954 1.157 1.283 1.835l2.343-1.35a9.94 9.94 0 00-1.819-2.532C17.373 2.97 14.849 1.65 12 1.65c-5.7 0-10.35 4.65-10.35 10.35S6.3 22.35 12 22.35c2.849 0 5.373-1.32 7.49-3.297.539-.54.992-1.157 1.35-1.819l-2.343-1.35c-.329.678-.759 1.295-1.283 1.835l-.22-.985z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Android (Firefox)</h2>
                <p className="text-sm text-text-secondary">Alternative browser</p>
              </div>
            </div>

            <ol className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                <div>
                  <p className="font-medium text-text-primary">Tap the menu button (⋮)</p>
                  <p className="text-sm">Located in the top right corner of Firefox</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                <div>
                  <p className="font-medium text-text-primary">Select "Install"</p>
                  <p className="text-sm">Look for the "Install" or "Add to Home screen" option with a phone icon</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">✓</div>
                <div>
                  <p className="font-medium text-text-primary">Confirm installation</p>
                  <p className="text-sm">Firefox will add PriceMon to your home screen</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Desktop Instructions */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Desktop (Chrome / Edge)</h2>
                <p className="text-sm text-text-secondary">Works on Windows, Mac, Linux</p>
              </div>
            </div>

            <ol className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                <div>
                  <p className="font-medium text-text-primary">Look for the install icon</p>
                  <p className="text-sm">A <svg className="inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> icon will appear in the address bar</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                <div>
                  <p className="font-medium text-text-primary">Click "Install"</p>
                  <p className="text-sm">Or use menu (⋮) → "Install PriceMon..."</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">✓</div>
                <div>
                  <p className="font-medium text-text-primary">Launch as desktop app</p>
                  <p className="text-sm">PriceMon opens in its own window, separate from your browser</p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Need Help Section */}
        <div className="card mt-6 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Need Help?</h3>
              <p className="text-sm text-blue-800 mb-2">
                If you don't see the install option, try:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Refreshing the page</li>
                <li>Using the browser's menu (⋮ or ⋯)</li>
                <li>Making sure you're using a supported browser (Safari, Chrome, Firefox, Edge)</li>
                <li>Checking that you're on HTTPS (secure connection)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstallApp;
