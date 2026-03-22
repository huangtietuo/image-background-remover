'use client';

import { useState, useRef, useCallback, MouseEvent, TouchEvent } from 'react';
import { Upload, Download, X, Image as ImageIcon } from 'lucide-react';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSliding, setIsSliding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';

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
      // Convert data URL to blob
      const response = await fetch(originalImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'image.png');

      const apiResponse = await fetch(`${WORKER_URL}/remove-background`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.json();
        if (error.error.includes('Rate limit')) {
          throw new Error('Daily limit reached. Try again tomorrow or upgrade to a paid plan.');
        }
        throw new Error(error.error || 'Failed to remove background');
      }

      const processedBlob = await apiResponse.blob();
      const processedUrl = URL.createObjectURL(processedBlob);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            🖼️ Background Remover
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Remove image backgrounds automatically in seconds • 100% free
          </p>
          <nav className="flex justify-center gap-6 mt-4 text-sm">
            <a href="/pricing" className="text-gray-600 hover:text-blue-600">Pricing</a>
            <a href="/about" className="text-gray-600 hover:text-blue-600">About</a>
            <a href="/privacy" className="text-gray-600 hover:text-blue-600">Privacy</a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-red-700">{error}</span>
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
            🆓 <strong>Free:</strong> 3 images/day for anonymous users • No registration required
          </p>
        </div>

        {/* Upload area */}
        {!originalImage && (
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
      <footer className="mt-16 py-8 text-center text-gray-600">
        <p>
          Made with ❤️ • Free online background removal tool
        </p>
      </footer>
    </div>
  );
}
