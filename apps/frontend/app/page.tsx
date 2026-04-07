'use client';

import { useState, useRef, useCallback, MouseEvent, TouchEvent, useEffect } from 'react';
import { Upload, Download, X, Image as ImageIcon } from 'lucide-react';

// Google Client ID
const GOOGLE_CLIENT_ID = '642236827987-18qj94l0rgeet2jfjo8clatnnrr61fiv.apps.googleusercontent.com';
// Worker API base URL
const WORKER_API_URL = 'http://localhost:8787';

interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture: string;
  is_subscribed: number;
  daily_free_count: number;
  last_reset_date: string;
}

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSliding, setIsSliding] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use Next.js API proxy to avoid CORS issues when accessing from external IP
  const API_URL = '/api/remove-background';

  // Log function for production
  const log = (msg: string) => {
    console.log(msg);
  };

  // Check for stored token and load user info
  useEffect(() => {
    log('Page loaded, initializing...');

    // Check for URL parameters from Google redirect
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'login') {
      log('Login success from redirect');
      // Simulate a successful login for local testing
      const mockUser = {
        id: 1,
        google_id: 'test_google_id',
        email: 'test@example.com',
        name: 'Test User',
        picture: null,
        is_subscribed: 0,
        daily_free_count: 0,
        last_reset_date: new Date().toISOString().split('T')[0]
      };
      setUser(mockUser);
      localStorage.setItem('google_token', 'mock_token');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, '/');
    } else if (error) {
      log(`Login error from redirect: ${error}`);
      setError(`Login failed: ${error}`);
      // Clear the URL parameters
      window.history.replaceState({}, document.title, '/');
    }

    // Check for stored token
    const token = localStorage.getItem('google_token');
    if (token && token !== 'mock_token') {
      // In a real app, you would validate the token and fetch user info
      log('Found stored token, loading user info');
    } else if (token === 'mock_token') {
      // Load mock user for testing
      const mockUser = {
        id: 1,
        google_id: 'test_google_id',
        email: 'test@example.com',
        name: 'Test User',
        picture: null,
        is_subscribed: 0,
        daily_free_count: 0,
        last_reset_date: new Date().toISOString().split('T')[0]
      };
      setUser(mockUser);
    }

    // Try real Google login if not using mock
    try {
      (window as any).handleGoogleSignInSuccess = async (response: any) => {
        log('Google login success callback called');
        const credential = response.credential;
        localStorage.setItem('google_token', credential);

        try {
          log('Sending credential to worker API');
          const res = await fetch(`${WORKER_API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential })
          });
          const data = await res.json();
          log(`Worker response: ${JSON.stringify(data)}`);
          if (data.success && data.user) {
            setUser(data.user);
            // Reload to refresh quota
            window.location.reload();
          } else {
            setError('Login failed: ' + (data.error || 'Unknown error'));
            localStorage.removeItem('google_token');
          }
        } catch (err) {
          console.error('Login error:', err);
          log(`Login error: ${err}`);
          setError('Login failed: Network error');
          localStorage.removeItem('google_token');
        }
      };
    } catch (err) {
      log(`Failed to initialize Google login: ${err}`);
    }

    setIsLoadingUser(false);
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('google_token');
    setUser(null);
    window.location.reload();
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select JPEG, PNG, or WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(null);
      setSliderPosition(50);
    };
    reader.readAsDataURL(file);
  };

  const removeBackground = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Convert base64 to FormData to send to worker
      const byteString = atob(originalImage.split(',')[1]);
      const mimeString = originalImage.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const formData = new FormData();
      formData.append('image', blob, 'image.png');

      const headers: Record<string, string> = {};
      const token = localStorage.getItem('google_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const apiResponse = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.json();
        if (error.require_subscription) {
          throw new Error(`${error.details} <a href="/pricing" class="underline font-semibold">Go to subscription page →</a>`);
        }
        throw new Error(error.error || 'Failed to remove background');
      }

      // The API returns an image directly as blob, not JSON
      const resultBlob = await apiResponse.blob();
      const processedUrl = URL.createObjectURL(resultBlob);
      setProcessedImage(processedUrl);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'background-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setSliderPosition(50);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Before/after slider handling
  const handleSliderStart = () => {
    setIsSliding(true);
  };

  const handleSliderEnd = () => {
    setIsSliding(false);
  };

  const handleSliderMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isSliding || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e
      ? e.touches[0].clientX - rect.left
      : (e as MouseEvent).clientX - rect.left;

    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isSliding]);

  // Trigger Google Sign In - using direct OAuth redirect
  const triggerGoogleSignIn = useCallback(() => {
    log('Login button clicked - using OAuth redirect');

    const redirectUri = window.location.origin + '/api/auth/callback/google';
    const scope = 'email profile openid';

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', scope);
    googleAuthUrl.searchParams.set('access_type', 'online');
    googleAuthUrl.searchParams.set('prompt', 'consent');

    log(`Redirecting to: ${googleAuthUrl.toString()}`);
    window.location.href = googleAuthUrl.toString();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">


      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 pb-20">
          {/* First row: title and login button */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🖼️ Background Remover
              </h1>
              <p className="text-gray-600 mt-2">
                Remove image backgrounds automatically in seconds • 100% free
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isLoadingUser ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">
                      {3 - (user.daily_free_count || 0)} free images left today
                    </div>
                  </div>
                  {user.picture && (
                    <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                  )}
                  <button onClick={handleLogout} className="btn-secondary py-2 px-4 text-sm">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    className="flex items-center justify-center px-5 py-3 border-2 border-gray-300 bg-white hover:bg-gray-50 rounded-lg cursor-pointer transition-colors shadow-sm"
                    onClick={triggerGoogleSignIn}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" className="mr-3">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.95 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.26-.78-.26-1.64 0-2.42V8.84H2.18v2.84C1.46 11.75 1.14 13.13 1.14 14.5s.32 2.75 1.04 3.84l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.48c1.69 0 2.83.73 3.48 1.34l2.59-2.58C17.46 2.56 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.51l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-base font-medium text-gray-700">Sign in with Google</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Second row: navigation */}
          <nav className="flex justify-center gap-6 pt-2 border-t border-gray-100">
            <a href="/pricing" className="text-gray-600 hover:text-blue-600 py-2">Pricing</a>
            <a href="/about" className="text-gray-600 hover:text-blue-600 py-2">About</a>
            <a href="/privacy" className="text-gray-600 hover:text-blue-600 py-2">Privacy</a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl pb-20">
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-red-700" dangerouslySetInnerHTML={{ __html: error }} />
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X size={20} />
            </button>
          </div>
        )}



        {/* Free usage info */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-center">
            {user ? (
              user.is_subscribed ? (
                <>✅ <strong>Subscribed:</strong> Unlimited access today</>
              ) : (
                <>🆓 <strong>Free:</strong> {3 - (user.daily_free_count || 0)} images remaining today • <a href="/pricing" className="underline font-semibold">Subscribe for unlimited</a></>
              )
            ) : (
              <>🔑 <strong>Login required:</strong> Please sign in with Google above to use this tool • 3 free images/day</>
            )}
          </p>
        </div>

        {/* Upload area - only show when logged in */}
        {!user && !isLoadingUser && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500 mb-4">Please login with Google above to start removing backgrounds</p>
          </div>
        )}

        {user && !originalImage && (
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-blue-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <Upload size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Drop your image here
            </h3>
            <p className="text-gray-500 mb-6">
              or click to browse • JPG, PNG, WebP up to 10MB
            </p>
            <button className="btn-primary">
              Choose Image
            </button>
          </div>
        )}

        {/* Before/After Comparison Slider */}
        {user && (
          <>
            {originalImage && processedImage && (
              <div className="mb-8">
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                  <h3 className="font-semibold text-gray-700 mb-4 text-center">
                    Drag the slider to compare before and after
                  </h3>
                  <div
                    ref={containerRef}
                    className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 select-none"
                    onMouseDown={handleSliderStart}
                    onMouseMove={handleSliderMove}
                    onMouseUp={handleSliderEnd}
                    onMouseLeave={handleSliderEnd}
                    onTouchStart={handleSliderStart}
                    onTouchMove={handleSliderMove}
                    onTouchEnd={handleSliderEnd}
                  >
                    {/* Original (behind) */}
                    <img
                      src={originalImage}
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    {/* Processed (clipped) */}
                    <div
                      className="absolute inset-0 h-full"
                      style={{ width: `${sliderPosition}%`, overflow: 'hidden' }}
                    >
                      <img
                        src={processedImage}
                        alt="Background removed"
                        className="absolute inset-0 w-full h-full object-contain bg-white"
                      />
                    </div>
                    {/* Slider handle */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                      style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Original
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Result
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Simple preview when processing or before processing */}
            {originalImage && !processedImage && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Original */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-700">Original</h3>
                  </div>
                  <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[300px]">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  </div>
                </div>

                {/* Result */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-700">Result</h3>
                  </div>
                  <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[300px]">
                    {isProcessing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Processing...</p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Click "Remove Background" to process</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center">
              {originalImage && (
                <>
                  {!processedImage && !isProcessing && (
                    <button
                      className="btn-primary"
                      onClick={removeBackground}
                    >
                      🪄 Remove Background
                    </button>
                  )}
                  {processedImage && (
                    <button
                      className="btn-primary bg-green-600 hover:bg-green-700"
                      onClick={downloadImage}
                    >
                      <Download size={20} className="inline-block mr-2" />
                      Download Result
                    </button>
                  )}
                  <button
                    className="btn-secondary"
                    onClick={reset}
                  >
                    🔄 New Image
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Upload size={24} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No Installation</h3>
            <p className="text-gray-600">
              100% online, works in any browser. No software to download or install.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <ImageIcon size={24} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Fast AI Processing</h3>
            <p className="text-gray-600">
              Powered by industry-leading AI. Get perfect results in seconds.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <X size={24} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Privacy First</h3>
            <p className="text-gray-600">
              We never store your images. All processing is done at the edge.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-gray-600 pb-24">
        <p>
          Made with ❤️ • Free online background removal tool
        </p>
      </footer>
    </div>
  );
}
