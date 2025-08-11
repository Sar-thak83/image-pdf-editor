"use client";

import { useState, useRef, useCallback } from "react";
import { changeBackground } from "../utils/backgroundRemoval";
import FileUpload from "./FileUpload";
import LoadingSpinner from "./LoadingSpinner";

export default function BackgroundChanger() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("#FFFFFF"); // Default white
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle file upload
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setProcessedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setOriginalImage(imageUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  // Process image with new background
  const processImage = async () => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true);
    setError(null);

    try {
      const processedUrl = await changeBackground(
        originalImage,
        selectedColor,
        canvasRef.current
      );
      setProcessedImage(processedUrl);
    } catch (err) {
      setError("Failed to change background. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download processed image
  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `passport-photo-${selectedColor.replace("#", "")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset to initial state
  const resetImages = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          Passport Photo Background Changer
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
          Upload your photo and select any background color for passport, visa,
          or ID photo requirements.
        </p>
      </div>

      {!originalImage ? (
        <FileUpload
          onFileSelect={handleFileSelect}
          accept="image/*"
          maxSize={10 * 1024 * 1024} // 10MB
          description="Upload a photo to change its background"
        />
      ) : (
        <div className="space-y-10">
          {/* Color Picker */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
              Choose Background Color
            </h3>

            <div className="flex items-center space-x-6 mb-8">
              {/* Visual Color Picker */}
              <div className="relative group">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-20 h-20 cursor-pointer border-4 border-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 appearance-none bg-transparent"
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    padding: "0",
                    border: "4px solid white",
                    borderRadius: "1rem",
                  }}
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              {/* Manual Input */}
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Value
                </label>
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  placeholder="#FFFFFF or rgb(255,255,255)"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={processImage}
              disabled={isProcessing}
              className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:transform-none disabled:hover:shadow-none"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Change Background"
              )}
            </button>
          </div>

          {/* Image Comparison */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Original */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform hover:scale-[1.02] transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 text-lg flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Original Image
                </h3>
              </div>
              <div className="p-6">
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-auto max-h-96 object-contain mx-auto rounded-xl shadow-md"
                  />
                  <div className="absolute top-3 right-3">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-gray-700 shadow-lg">
                      Original
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Processed */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform hover:scale-[1.02] transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 text-lg flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${
                      processedImage
                        ? "bg-blue-500 animate-pulse"
                        : "bg-gray-300"
                    }`}
                  ></div>
                  New Background
                </h3>
              </div>
              <div className="p-6 min-h-[250px] flex items-center justify-center">
                {isProcessing ? (
                  <div className="text-center">
                    <LoadingSpinner message="Changing background..." />
                  </div>
                ) : processedImage ? (
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src={processedImage}
                      alt="Background changed"
                      className="w-full h-auto max-h-96 object-contain mx-auto rounded-xl shadow-md"
                    />
                    <div className="absolute top-3 right-3">
                      <div className="bg-gradient-to-b from-blue-500 to-purple-500 text-white rounded-full px-3 py-1 text-xs font-semibold shadow-lg">
                        Processed
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </div>
                    <p className="text-red-600 font-medium">{error}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">
                      Pick a color and click "Change Background" to see the
                      result
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center items-center space-x-6 pt-4">
            <button
              onClick={resetImages}
              className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                ></path>
              </svg>
              <span>Upload New Image</span>
            </button>
            {processedImage && (
              <button
                onClick={downloadImage}
                className="px-8 py-3 bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <span>Download Result</span>
              </button>
            )}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
