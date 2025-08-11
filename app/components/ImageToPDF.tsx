"use client";

import { useState, useCallback } from "react";
import { convertImagesToPDF } from "../utils/pdfConverter";
import FileUpload from "./FileUpload";

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

export default function ImageToPDF() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    const id = Date.now().toString() + Math.random().toString(36);
    const url = URL.createObjectURL(file);

    const newImage: UploadedImage = {
      id,
      file,
      url,
      name: file.name,
    };

    setImages((prev) => [...prev, newImage]);
  }, []);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const moveImage = (id: string, direction: "up" | "down") => {
    setImages((prev) => {
      const currentIndex = prev.findIndex((img) => img.id === id);
      if (currentIndex === -1) return prev;

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newImages = [...prev];
      const [movedItem] = newImages.splice(currentIndex, 1);
      newImages.splice(newIndex, 0, movedItem);
      return newImages;
    });
  };

  const convertToPDF = async () => {
    if (images.length === 0) return;

    setIsConverting(true);
    try {
      const pdfBlob = await convertImagesToPDF(images.map((img) => img.file));

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "images-converted.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF conversion failed:", error);
      alert("Failed to convert images to PDF. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const clearAllImages = () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          Images to PDF Converter
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
          Upload multiple images and convert them into a single PDF document.
          Perfect for combining photos, documents, or creating photo albums.
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-10">
        <FileUpload
          onFileSelect={handleFileSelect}
          accept="image/*"
          maxSize={10 * 1024 * 1024} // 10MB
          description="Add images to your PDF (JPG, PNG supported)"
          multiple={true}
        />
      </div>

      {/* Images List */}
      {images.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-10 border border-gray-100">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-800">Images in PDF</h3>
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {images.length} {images.length === 1 ? "image" : "images"}
              </div>
            </div>
            <button
              onClick={clearAllImages}
              className="text-red-500 hover:text-red-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-50 transition-all duration-300 flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
              <span>Clear All</span>
            </button>
          </div>

          <div className="p-8">
            <div className="space-y-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="group flex items-center space-x-6 p-5 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {/* Page Number Badge */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {index + 1}
                  </div>

                  {/* Preview */}
                  <div className="relative">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300"
                    />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate mb-1">
                      {image.name}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        ></path>
                      </svg>
                      <span>
                        Page {index + 1} of {images.length}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => moveImage(image.id, "up")}
                      disabled={index === 0}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-100 rounded-lg transition-all duration-300 group/btn"
                      title="Move up"
                    >
                      <svg
                        className="w-5 h-5 transform group-hover/btn:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 15l7-7 7 7"
                        ></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => moveImage(image.id, "down")}
                      disabled={index === images.length - 1}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-100 rounded-lg transition-all duration-300 group/btn"
                      title="Move down"
                    >
                      <svg
                        className="w-5 h-5 transform group-hover/btn:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-300 group/btn"
                      title="Remove"
                    >
                      <svg
                        className="w-5 h-5 transform group-hover/btn:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Convert Button */}
      {images.length > 0 && (
        <div className="text-center space-y-4">
          <button
            onClick={convertToPDF}
            disabled={isConverting}
            className="px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:transform-none disabled:hover:shadow-none flex items-center space-x-3 mx-auto"
          >
            {isConverting ? (
              <>
                <svg
                  className="animate-spin w-6 h-6 text-white"
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
                <span>Converting...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <span>
                  Convert {images.length} Image{images.length > 1 ? "s" : ""} to
                  PDF
                </span>
              </>
            )}
          </button>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
            <p className="text-sm text-gray-600 flex items-center justify-center space-x-2">
              <svg
                className="w-4 h-4 text-blue-500"
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
              <span>Your PDF will be downloaded automatically when ready</span>
            </p>
          </div>
        </div>
      )}

      {/* Tips Section */}
      {images.length === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8 mt-8">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
            <svg
              className="w-6 h-6 text-blue-500 mr-3"
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
            How it works
          </h4>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                1
              </div>
              <p>
                <strong>Upload Images:</strong> Add multiple photos or documents
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                2
              </div>
              <p>
                <strong>Arrange Order:</strong> Drag to reorder pages as needed
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                3
              </div>
              <p>
                <strong>Convert & Download:</strong> Get your PDF instantly
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
