"use client";

import { useState, useCallback } from "react";
import FileUpload from "./FileUpload";
import LoadingSpinner from "./LoadingSpinner";

interface UploadedPDF {
  id: string;
  file: File;
  name: string;
  pageCount?: number;
  size: string;
}

export default function PDFMerger() {
  const [pdfs, setPdfs] = useState<UploadedPDF[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const loadPDFLib = async () => {
    if (typeof window !== "undefined" && !(window as any).PDFLib) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
        script.onload = () => resolve((window as any).PDFLib);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return (window as any).PDFLib;
  };

  const getPageCount = async (file: File): Promise<number> => {
    try {
      const PDFLib = await loadPDFLib();
      const pdfBytes = await file.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(pdfBytes);
      return pdf.getPageCount();
    } catch (error) {
      console.error("Error getting page count:", error);
      return 1;
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Please upload only PDF files.");
      return;
    }

    const id = Date.now().toString() + Math.random().toString(36);
    const pageCount = await getPageCount(file);

    const newPDF: UploadedPDF = {
      id,
      file,
      name: file.name,
      pageCount,
      size: formatFileSize(file.size),
    };

    setPdfs((prev) => [...prev, newPDF]);
  }, []);

  const removePDF = (id: string) => {
    setPdfs((prev) => prev.filter((pdf) => pdf.id !== id));
  };

  const movePDF = (id: string, direction: "up" | "down") => {
    setPdfs((prev) => {
      const currentIndex = prev.findIndex((pdf) => pdf.id === id);
      if (currentIndex === -1) return prev;

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newPDFs = [...prev];
      const [movedItem] = newPDFs.splice(currentIndex, 1);
      newPDFs.splice(newIndex, 0, movedItem);
      return newPDFs;
    });
  };

  const mergePDFs = async () => {
    if (pdfs.length < 2) {
      alert("Please upload at least 2 PDF files to merge.");
      return;
    }

    setIsMerging(true);
    try {
      const PDFLib = await loadPDFLib();
      const { PDFDocument } = PDFLib;

      const mergedPdf = await PDFDocument.create();

      for (const pdf of pdfs) {
        const pdfBytes = await pdf.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(
          pdfDoc,
          pdfDoc.getPageIndices()
        );
        copiedPages.forEach((page: any) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const mergedBlob = new Blob([mergedPdfBytes], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(mergedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "merged-document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("PDFs merged successfully!");
    } catch (error) {
      console.error("PDF merge failed:", error);
      alert("Failed to merge PDFs. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  const clearAllPDFs = () => {
    setPdfs([]);
  };

  const totalPages = pdfs.reduce((sum, pdf) => sum + (pdf.pageCount || 0), 0);
  const totalSize = pdfs.reduce((sum, pdf) => sum + pdf.file.size, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          PDF Merger
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
          Upload multiple PDF files and merge them into a single document.
          Perfect for combining reports, contracts, or organizing documents.
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-10">
        <FileUpload
          onFileSelect={handleFileSelect}
          accept="application/pdf"
          maxSize={50 * 1024 * 1024} // 50MB
          description="Add PDF files to merge (PDF format only)"
          multiple={true}
        />
      </div>

      {/* PDF List */}
      {pdfs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-10 border border-gray-100">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-800">PDFs to Merge</h3>
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {pdfs.length} {pdfs.length === 1 ? "file" : "files"}
              </div>
              {totalPages > 0 && (
                <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {totalPages} pages total
                </div>
              )}
            </div>
            <button
              onClick={clearAllPDFs}
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
              {pdfs.map((pdf, index) => (
                <div
                  key={pdf.id}
                  className="group flex items-center space-x-6 p-5 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {/* Order Number Badge */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {index + 1}
                  </div>

                  {/* PDF Icon */}
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-xl border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z" />
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
                      </svg>
                    </div>
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

                  {/* PDF Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate mb-1">
                      {pdf.name}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
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
                        <span>{pdf.pageCount} pages</span>
                      </div>
                      <div className="flex items-center space-x-1">
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
                            d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-6 12V8m0 0l-2 2m2-2l2 2m-8 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          ></path>
                        </svg>
                        <span>{pdf.size}</span>
                      </div>
                      <span className="text-blue-600 font-medium">
                        Position {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => movePDF(pdf.id, "up")}
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
                      onClick={() => movePDF(pdf.id, "down")}
                      disabled={index === pdfs.length - 1}
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
                      onClick={() => removePDF(pdf.id)}
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

      {/* Merge Button */}
      {pdfs.length > 0 && (
        <div className="text-center space-y-4">
          {isMerging ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <LoadingSpinner message="Merging PDFs..." />
              <p className="text-sm text-gray-500 mt-4">
                Processing {pdfs.length} files with {totalPages} total pages...
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={mergePDFs}
                disabled={pdfs.length < 2}
                className="px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:transform-none disabled:hover:shadow-none flex items-center space-x-3 mx-auto"
              >
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
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
                <span>Merge PDFs</span>
              </button>

              {pdfs.length >= 2 && (
                <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
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
                      />
                    </svg>
                    <span>Total: {totalPages} pages</span>
                  </div>
                  <div className="flex items-center space-x-2">
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
                        d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-6 12V8m0 0l-2 2m2-2l2 2m-8 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Size: {formatFileSize(totalSize)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {pdfs.length === 0 && (
        <div className="text-center py-16">
          <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No PDFs uploaded yet
          </h3>
          <p className="text-gray-500">
            Upload multiple PDF files to get started with merging
          </p>
        </div>
      )}
    </div>
  );
}
