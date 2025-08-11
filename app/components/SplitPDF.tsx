"use client";

import { useState, useCallback } from "react";
import FileUpload from "./PDFFileUpload";
import LoadingSpinner from "./LoadingSpinner";
import { PDFDocument, PDFPage } from "pdf-lib";

interface SplitRange {
  start: number;
  end: number;
  name: string;
}

interface SplitPDFProps {
  onSplitComplete?: (files: File[]) => void;
  maxFileSize?: number;
}

// PDF.js and pdf-lib types (simplified)
declare global {
  interface Window {
    pdfjsLib: any;
    PDFLib: any;
  }
}

export default function SplitPDF({
  onSplitComplete,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
}: SplitPDFProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [splitRanges, setSplitRanges] = useState<SplitRange[]>([
    { start: 1, end: 1, name: "Split 1" },
  ]);
  const [splitMethod, setSplitMethod] = useState<"ranges" | "individual">(
    "ranges"
  );
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

  // Load required libraries
  const loadLibraries = useCallback(async () => {
    if (window.pdfjsLib && window.PDFLib) return;

    // Load PDF.js
    if (!window.pdfjsLib) {
      const pdfScript = document.createElement("script");
      pdfScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      document.head.appendChild(pdfScript);

      await new Promise<void>((resolve) => {
        pdfScript.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve();
        };
      });
    }

    // Load pdf-lib
    if (!window.PDFLib) {
      const pdflibScript = document.createElement("script");
      pdflibScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
      document.head.appendChild(pdflibScript);

      await new Promise<void>((resolve) => {
        pdflibScript.onload = () => resolve();
      });
    }
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsProcessing(true);

      try {
        // Ensure libraries are loaded
        await loadLibraries();

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // ===== FIX START =====
        // Create two independent copies of the ArrayBuffer:
        // - one for pdfjs (pdfjs may detach its buffer internally)
        // - a separate Uint8Array copy to keep for pdf-lib operations (we store this in state)
        const pdfjsBuffer = arrayBuffer.slice(0); // ArrayBuffer copy for pdfjs
        const uint8Array = new Uint8Array(arrayBuffer.slice(0)); // separate Uint8Array for pdf-lib usage
        setPdfBytes(uint8Array);
        // ===== FIX END =====

        // Load PDF document to get page count
        if (window.pdfjsLib) {
          // pass pdfjsBuffer (ArrayBuffer) to PDF.js so it can operate on its own copy
          const pdf = await window.pdfjsLib.getDocument({ data: pdfjsBuffer })
            .promise;
          const pageCount = pdf.numPages;
          setTotalPages(pageCount);

          // Reset split ranges when new file is selected
          setSplitRanges([{ start: 1, end: pageCount, name: "Full Document" }]);
        } else {
          throw new Error("PDF.js failed to load");
        }
      } catch (err) {
        console.error("PDF processing error:", err);
        setError("Failed to process PDF file. Please ensure it's a valid PDF.");
      } finally {
        setIsProcessing(false);
      }
    },
    [loadLibraries]
  );

  const addSplitRange = useCallback(() => {
    if (!totalPages) return;

    const newIndex = splitRanges.length + 1;
    setSplitRanges((prev) => [
      ...prev,
      {
        start: 1,
        end: totalPages,
        name: `Split ${newIndex}`,
      },
    ]);
  }, [splitRanges.length, totalPages]);

  const removeSplitRange = useCallback((index: number) => {
    setSplitRanges((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateSplitRange = useCallback(
    (index: number, field: keyof SplitRange, value: string | number) => {
      setSplitRanges((prev) =>
        prev.map((range, i) =>
          i === index ? { ...range, [field]: value } : range
        )
      );
    },
    []
  );

  const validateRanges = useCallback(() => {
    if (!totalPages) return { isValid: false, error: "No PDF loaded" };

    for (const range of splitRanges) {
      if (range.start < 1 || range.start > totalPages) {
        return {
          isValid: false,
          error: `Start page ${range.start} is out of range (1-${totalPages})`,
        };
      }
      if (range.end < 1 || range.end > totalPages) {
        return {
          isValid: false,
          error: `End page ${range.end} is out of range (1-${totalPages})`,
        };
      }
      if (range.start > range.end) {
        return {
          isValid: false,
          error: `Invalid range: ${range.start} to ${range.end}`,
        };
      }
      if (!range.name.trim()) {
        return { isValid: false, error: "All ranges must have a name" };
      }
    }

    return { isValid: true, error: null };
  }, [splitRanges, totalPages]);

  const splitPDFByRanges = useCallback(async (): Promise<File[]> => {
    if (!pdfBytes || !window.PDFLib)
      throw new Error("PDF data or pdf-lib not available");

    const splitFiles: File[] = [];

    for (const range of splitRanges) {
      try {
        // Create a proper copy of the PDF bytes to avoid detachment
        const freshPdfBytes = pdfBytes.slice();

        // Load the source PDF
        const pdfDoc = await window.PDFLib.PDFDocument.load(freshPdfBytes);

        // Create new PDF document
        const newPdfDoc = await window.PDFLib.PDFDocument.create();

        // Copy pages from source to new document
        const pageIndices = [];
        for (let i = range.start - 1; i < range.end; i++) {
          pageIndices.push(i);
        }

        const copiedPages: PDFPage[] = await newPdfDoc.copyPages(
          pdfDoc,
          pageIndices
        );
        copiedPages.forEach((page: PDFPage) => newPdfDoc.addPage(page));

        // Serialize the new PDF
        const pdfBytesNew = await newPdfDoc.save();

        // Create file
        const blob = new Blob([pdfBytesNew], { type: "application/pdf" });
        const fileName = `${range.name.replace(/[^a-zA-Z0-9]/g, "_")}_pages_${
          range.start
        }-${range.end}.pdf`;
        splitFiles.push(
          new File([blob], fileName, { type: "application/pdf" })
        );
      } catch (err) {
        console.error(`Error creating range ${range.name}:`, err);
        throw new Error(`Failed to create range: ${range.name}`);
      }
    }

    return splitFiles;
  }, [splitRanges, pdfBytes]);

  const splitPDFIndividually = useCallback(async (): Promise<File[]> => {
    if (!pdfBytes || !window.PDFLib)
      throw new Error("PDF data or pdf-lib not available");

    const splitFiles: File[] = [];

    for (let pageNum = 1; pageNum <= totalPages!; pageNum++) {
      try {
        // Create a proper copy of the PDF bytes to avoid detachment
        const freshPdfBytes = pdfBytes.slice();

        // Load the source PDF
        const pdfDoc = await window.PDFLib.PDFDocument.load(freshPdfBytes);

        // Create new PDF document with single page
        const newPdfDoc = await window.PDFLib.PDFDocument.create();

        // Copy single page
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
        newPdfDoc.addPage(copiedPage);

        // Serialize the new PDF
        const pdfBytesNew = await newPdfDoc.save();

        // Create file
        const blob = new Blob([pdfBytesNew], { type: "application/pdf" });
        const fileName = `page_${pageNum.toString().padStart(3, "0")}.pdf`;
        splitFiles.push(
          new File([blob], fileName, { type: "application/pdf" })
        );
      } catch (err) {
        console.error(`Error creating page ${pageNum}:`, err);
        throw new Error(`Failed to create page ${pageNum}`);
      }
    }

    return splitFiles;
  }, [totalPages, pdfBytes]);

  const handleSplit = useCallback(async () => {
    if (!selectedFile || !totalPages || !pdfBytes) return;

    // Validate ranges if using range method
    if (splitMethod === "ranges") {
      const validation = validateRanges();
      if (!validation.isValid) {
        setError(validation.error!);
        return;
      }
    }

    setIsProcessing(true);
    setError(null);

    try {
      let splitFiles: File[];

      if (splitMethod === "individual") {
        splitFiles = await splitPDFIndividually();
      } else {
        splitFiles = await splitPDFByRanges();
      }

      onSplitComplete?.(splitFiles);
      splitFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      // Show success message
      alert(`Successfully split PDF into ${splitFiles.length} files!`);

      // Reset state after successful split
      setSelectedFile(null);
      setTotalPages(null);
      setPdfBytes(null);
      setSplitRanges([{ start: 1, end: 1, name: "Split 1" }]);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error("Split error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to split PDF. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    selectedFile,
    totalPages,
    pdfBytes,
    splitMethod,
    validateRanges,
    splitPDFIndividually,
    splitPDFByRanges,
    onSplitComplete,
    previewUrl,
  ]);

  const resetFile = useCallback(() => {
    setSelectedFile(null);
    setTotalPages(null);
    setPdfBytes(null);
    setSplitRanges([{ start: 1, end: 1, name: "Split 1" }]);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  if (isProcessing) {
    return (
      <LoadingSpinner
        message={
          selectedFile && !totalPages
            ? "Analyzing PDF structure..."
            : "Splitting PDF into files..."
        }
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          PDF Splitter
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload a PDF file and split it into multiple documents by page ranges
          or individual pages
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
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
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {!selectedFile ? (
        <FileUpload
          onFileSelect={handleFileSelect}
          accept=".pdf,application/pdf"
          maxSize={maxFileSize}
          description="Select a PDF file to split into multiple documents"
        />
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
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
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedFile.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    {totalPages && ` • ${totalPages} pages`}
                  </p>
                </div>
              </div>
              <button
                onClick={resetFile}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
          </div>

          {totalPages && (
            <>
              {/* Split Method Selection */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Split Method
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative">
                    <input
                      type="radio"
                      name="splitMethod"
                      value="ranges"
                      checked={splitMethod === "ranges"}
                      onChange={(e) =>
                        setSplitMethod(e.target.value as "ranges")
                      }
                      className="sr-only"
                    />
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        splitMethod === "ranges"
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            splitMethod === "ranges"
                              ? "border-blue-500 bg-gradient-to-r from-blue-500 to-purple-500"
                              : "border-gray-300"
                          }`}
                        >
                          {splitMethod === "ranges" && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Custom Ranges
                          </h4>
                          <p className="text-sm text-gray-600">
                            Split by custom page ranges
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="relative">
                    <input
                      type="radio"
                      name="splitMethod"
                      value="individual"
                      checked={splitMethod === "individual"}
                      onChange={(e) =>
                        setSplitMethod(e.target.value as "individual")
                      }
                      className="sr-only"
                    />
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        splitMethod === "individual"
                          ? "border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            splitMethod === "individual"
                              ? "border-purple-500 bg-gradient-to-r from-purple-500 to-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {splitMethod === "individual" && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Individual Pages
                          </h4>
                          <p className="text-sm text-gray-600">
                            Split into {totalPages} separate files
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Split Configuration */}
              {splitMethod === "ranges" && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Page Ranges
                    </h3>
                    <button
                      onClick={addSplitRange}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8H4"
                        ></path>
                      </svg>
                      Add Range
                    </button>
                  </div>

                  <div className="space-y-4">
                    {splitRanges.map((range, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Range name"
                            value={range.name}
                            onChange={(e) =>
                              updateSplitRange(index, "name", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600 font-medium">
                            From:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={range.start}
                            onChange={(e) =>
                              updateSplitRange(
                                index,
                                "start",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600 font-medium">
                            To:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={range.end}
                            onChange={(e) =>
                              updateSplitRange(
                                index,
                                "end",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>
                        {splitRanges.length > 1 && (
                          <button
                            onClick={() => removeSplitRange(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-300 hover:scale-110"
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
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Range Summary */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Split Preview:
                    </h4>
                    <div className="space-y-1">
                      {splitRanges.map((range, index) => (
                        <div key={index} className="text-sm text-gray-700">
                          <span className="font-medium">{range.name}:</span>{" "}
                          Pages {range.start}-{range.end}
                          <span className="text-gray-500">
                            ({range.end - range.start + 1} pages)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Pages Preview */}
              {splitMethod === "individual" && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Individual Pages Split
                  </h3>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <p className="text-gray-700">
                      <span className="font-medium">
                        This will create {totalPages} separate PDF files:
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      page_001.pdf, page_002.pdf, page_003.pdf, ... page_
                      {totalPages.toString().padStart(3, "0")}.pdf
                    </p>
                  </div>
                </div>
              )}

              {/* Split Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSplit}
                  disabled={
                    splitMethod === "ranges" && splitRanges.length === 0
                  }
                  className="inline-flex items-center px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    ></path>
                  </svg>
                  Split PDF
                  {splitMethod === "individual" && ` (${totalPages} files)`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-blue-600">Custom Ranges:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Define specific page ranges to extract</li>
              <li>• Name each range for easy identification</li>
              <li>• Perfect for extracting chapters or sections</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-purple-600">Individual Pages:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Split every page into separate files</li>
              <li>• Automatically numbered (page_001.pdf, etc.)</li>
              <li>• Ideal for distributing single pages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
