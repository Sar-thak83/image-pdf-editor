"use client";

import { useState, useRef, useCallback } from "react";
import { removeBackground } from "../utils/backgroundRemoval";
import FileUpload from "./FileUpload";
import LoadingSpinner from "./LoadingSpinner";

export default function BackgroundRemover() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setProcessedImage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setOriginalImage(imageUrl);

      setIsProcessing(true);
      try {
        const processedUrl = await removeBackground(
          imageUrl,
          canvasRef.current!
        );
        setProcessedImage(processedUrl);
      } catch (err) {
        setError("Failed to remove background. Please try again.");
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage;
    link.download = "background-removed.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetImages = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          Background Remover
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
          Upload your photo and we'll automatically remove the background,
          perfect for ID photos, passport pictures, or professional headshots.
        </p>
      </div>

      {!originalImage ? (
        <FileUpload
          onFileSelect={handleFileSelect}
          accept="image/*"
          maxSize={10 * 1024 * 1024} // 10MB
          description="Upload an image to remove its background"
        />
      ) : (
        <div className="space-y-10">
          {/* Processing Status */}
          {isProcessing && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-gray-700 font-medium">
                  Processing your image...
                </span>
              </div>
            </div>
          )}

          {/* Image Comparison */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Original Image */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform hover:scale-[1.02] transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 text-lg flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Original Image
                </h3>
              </div>
              <div className="p-6">
                <div className="relative overflow-hidden rounded-xl bg-gray-50">
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

            {/* Processed Image */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform hover:scale-[1.02] transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 text-lg flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${
                      processedImage
                        ? "bg-blue-500 animate-pulse"
                        : isProcessing
                        ? "bg-blue-500 animate-spin"
                        : "bg-gray-300"
                    }`}
                  ></div>
                  Background Removed
                </h3>
              </div>
              <div
                className="p-6 min-h-[250px] flex items-center justify-center relative"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #f8fafc 25%, transparent 25%), 
                    linear-gradient(-45deg, #f8fafc 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #f8fafc 75%), 
                    linear-gradient(-45deg, transparent 75%, #f8fafc 75%)
                  `,
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
              >
                {isProcessing ? (
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200">
                    <LoadingSpinner message="Removing background..." />
                  </div>
                ) : processedImage ? (
                  <div className="relative">
                    <img
                      src={processedImage}
                      alt="Background removed"
                      className="w-full h-auto max-h-96 object-contain mx-auto rounded-xl shadow-lg"
                    />
                    <div className="absolute top-3 right-3">
                      <div className="bg-gradient-to-b from-blue-500 to-purple-500 text-white rounded-full px-3 py-1 text-xs font-semibold shadow-lg">
                        Processed
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-red-200">
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
                  <div className="text-center bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200">
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
                      Processing will start automatically...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
                className="px-8 py-3 bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
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

          {/* Processing Tips */}
          {!processedImage && !isProcessing && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mt-8">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <svg
                  className="w-5 h-5 text-blue-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Tips for better results
              </h4>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>
                  • Use images with clear contrast between subject and
                  background
                </li>
                <li>• Avoid backgrounds with similar colors to your subject</li>
                <li>
                  • Higher resolution images typically produce better results
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
