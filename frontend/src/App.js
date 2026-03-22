import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select JPEG, PNG, or WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target.result);
      setProcessedImage(null);
      setError(null);
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

      const apiResponse = await axios.post('/api/remove-background', formData, {
        responseType: 'blob'
      });

      const processedBlob = apiResponse.data;
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImage(processedUrl);
    } catch (err) {
      console.error('Error removing background:', err);
      setError(err.response?.data?.error || 'Failed to remove background. Please try again.');
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
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🖼️ Image Background Remover</h1>
        <p>Remove backgrounds from any image with AI</p>
      </header>

      <main className="main">
        {error && (
          <div className="error">
            {error}
            <button className="close-error" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {!originalImage ? (
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-content">
              <div className="icon">📁</div>
              <h3>Drag & drop your image here</h3>
              <p>or click to browse (JPEG, PNG, WebP up to 10MB)</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="file-input"
              />
              <button className="browse-btn">Browse Files</button>
            </div>
          </div>
        ) : (
          <div className="workspace">
            <div className="image-container">
              <h4>Original Image</h4>
              <div className="image-wrapper">
                <img src={originalImage} alt="Original" />
              </div>
            </div>

            <div className="image-container">
              <h4>Result</h4>
              <div className="image-wrapper">
                {processedImage ? (
                  <img src={processedImage} alt="Processed" />
                ) : isProcessing ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <p>Processing...</p>
                  </div>
                ) : (
                  <div className="empty-result">
                    <p>Click "Remove Background" to process</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="actions">
          {originalImage && (
            <>
              {!processedImage && (
                <button
                  className="btn primary"
                  onClick={removeBackground}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : '🪄 Remove Background'}
                </button>
              )}
              {processedImage && (
                <button className="btn secondary" onClick={downloadImage}>
                  📥 Download Result
                </button>
              )}
              <button className="btn tertiary" onClick={reset}>
                🔄 New Image
              </button>
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>Powered by AI • Built with React + Node.js</p>
      </footer>
    </div>
  );
}

export default App;
