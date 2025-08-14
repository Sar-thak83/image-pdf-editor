"use client";

import { useState, useCallback } from "react";
import FileUpload from "./PDFFileUpload";
import LoadingSpinner from "./LoadingSpinner";

interface UploadedPDF {
  id: string;
  file: File;
  name: string;
  pageCount?: number;
  size: string;
  status: "pending" | "converting" | "completed" | "error";
  downloadUrl?: string;
  convertedName?: string;
}

export default function PDFToDocxConverter() {
  const [pdfs, setPdfs] = useState<UploadedPDF[]>([]);
  const [isConverting, setIsConverting] = useState(false);

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

  const loadPdfParse = async () => {
    if (typeof window !== "undefined" && !(window as any).pdfjsLib) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve((window as any).pdfjsLib);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return (window as any).pdfjsLib;
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

  const extractStructuredTextFromPDF = async (file: File): Promise<any[]> => {
    try {
      const pdfjsLib = await loadPdfParse();
      const pdfBytes = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: pdfBytes,
        cMapUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
        cMapPacked: true,
        standardFontDataUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/",
      });

      const pdf = await loadingTask.promise;
      const pages = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1.0 });

          // Group text items by their vertical position to identify lines and structure
          const textItems = textContent.items
            .filter((item: any) => item.str && item.str.trim().length > 0)
            .map((item: any) => ({
              text: item.str,
              x: item.transform[4],
              y: viewport.height - item.transform[5], // Convert to top-down coordinates
              fontSize: item.height || 12,
              fontName: item.fontName || "normal",
              width: item.width || 0,
            }));

          // Group items into lines based on Y position
          const lines: any[] = [];
          const tolerance = 3; // pixels tolerance for same line

          textItems.forEach((item: any) => {
            let foundLine = lines.find(
              (line) => Math.abs(line.y - item.y) <= tolerance
            );

            if (!foundLine) {
              foundLine = { y: item.y, items: [], fontSize: item.fontSize };
              lines.push(foundLine);
            }

            foundLine.items.push(item);
            foundLine.fontSize = Math.max(foundLine.fontSize, item.fontSize);
          });

          // Sort lines by Y position (top to bottom)
          lines.sort((a, b) => a.y - b.y);

          // Sort items within each line by X position (left to right)
          lines.forEach((line) => {
            line.items.sort((a: any, b: any) => a.x - b.x);
            line.text = line.items.map((item: any) => item.text).join(" ");
          });

          pages.push({
            pageNumber: pageNum,
            lines: lines,
            width: viewport.width,
            height: viewport.height,
          });
        } catch (pageError) {
          console.warn(`Error processing page ${pageNum}:`, pageError);
          pages.push({
            pageNumber: pageNum,
            lines: [
              {
                text: `[Could not extract text from page ${pageNum}]`,
                fontSize: 12,
              },
            ],
            width: 612,
            height: 792,
          });
        }
      }

      return pages;
    } catch (error) {
      console.error("Error extracting structured text from PDF:", error);
      throw new Error(
        "Failed to extract text from PDF. The file may be password-protected, corrupted, or contain only images."
      );
    }
  };

  const loadJSZip = async () => {
    if (typeof window !== "undefined" && !(window as any).JSZip) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return (window as any).JSZip;
  };

  const createDocxDocument = async (
    pages: any[],
    originalName: string
  ): Promise<{ blob: Blob; extension: string }> => {
    if (!pages || pages.length === 0) {
      throw new Error("No content found in the PDF to convert.");
    }

    // Create OCR-style DOCX structure - preserving raw text extraction format
    const createDocxXML = (pages: any[]) => {
      let bodyContent = "";

      pages.forEach((page, pageIndex) => {
        // Add page break between pages (except first page)
        if (pageIndex > 0) {
          bodyContent += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
        }

        // Add page header in OCR format
        if (pages.length > 1) {
          bodyContent += `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Page ${page.pageNumber}:</w:t></w:r></w:p>`;
        }

        // Process each line as raw OCR output - minimal formatting
        page.lines.forEach((line: any) => {
          if (line.text.trim()) {
            // Escape XML characters
            const escapedText = line.text
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&apos;");

            // Use consistent OCR-style formatting - simple paragraphs with minimal spacing
            bodyContent += `<w:p><w:pPr><w:spacing w:after="60"/></w:pPr><w:r><w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/></w:rPr><w:t>${escapedText}</w:t></w:r></w:p>`;
          }
        });

        // Add extra space after each page
        if (pageIndex < pages.length - 1) {
          bodyContent +=
            '<w:p><w:pPr><w:spacing w:after="240"/></w:pPr><w:r><w:t></w:t></w:r></w:p>';
        }
      });

      return bodyContent;
    };

    const bodyContent = createDocxXML(pages);

    // DOCX document structure
    const documentXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyContent}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    // Create app.xml
    const appXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>PDF to DOCX Converter</Application>
  <TotalTime>0</TotalTime>
</Properties>`;

    // Create core.xml
    const coreXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties">
  <dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">${originalName.replace(
    ".pdf",
    ""
  )}</dc:title>
  <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">PDF to DOCX Converter</dc:creator>
  <cp:lastModifiedBy>PDF to DOCX Converter</cp:lastModifiedBy>
  <cp:revision>1</cp:revision>
  <dcterms:created xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`;

    // Create [Content_Types].xml
    const contentTypesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

    // Create _rels/.rels
    const mainRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

    // Use JSZip to create the DOCX file
    const createZip = async () => {
      try {
        const JSZip = await loadJSZip();
        const zip = new JSZip();

        // Add all the XML files to create a proper DOCX structure
        zip.file("[Content_Types].xml", contentTypesXML);
        zip.folder("_rels").file(".rels", mainRelsXML);
        zip.folder("docProps").file("core.xml", coreXML);
        zip.folder("docProps").file("app.xml", appXML);
        zip.folder("word").file("document.xml", documentXML);

        return await zip.generateAsync({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
      } catch (error) {
        console.error("JSZip error:", error);
        throw error;
      }
    };

    try {
      const blob = await createZip();
      return { blob, extension: "docx" };
    } catch (error) {
      console.error("Error creating DOCX:", error);
      // Fallback to RTF if DOCX creation fails
      return createRTFDocument(pages, originalName);
    }
  };

  const createRTFDocument = (
    pages: any[],
    originalName: string
  ): { blob: Blob; extension: string } => {
    let rtfContent = `{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat\\deflang1033{\\fonttbl{\\f0\\fmodern\\fprq1\\fcharset0 Courier New;}}
{\\*\\generator PDF to DOCX Converter - OCR Mode;}\\viewkind4\\uc1`;

    pages.forEach((page, pageIndex) => {
      if (pageIndex > 0) {
        rtfContent += "\\page ";
      }

      // Add page header in OCR format
      if (pages.length > 1) {
        rtfContent += `\\pard\\sa120\\sl276\\slmult1\\f0\\fs22 Page ${page.pageNumber}:\\par\\par`;
      }

      // Process each line as OCR output with minimal formatting
      page.lines.forEach((line: any) => {
        if (line.text.trim()) {
          const escapedText = line.text
            .replace(/\\/g, "\\\\")
            .replace(/\{/g, "\\{")
            .replace(/\}/g, "\\}")
            .trim();

          // Use monospace font and consistent formatting for OCR appearance
          rtfContent += `\\pard\\sa60\\sl276\\slmult1\\f0\\fs22 ${escapedText}\\par`;
        }
      });

      // Add space between pages
      if (pageIndex < pages.length - 1) {
        rtfContent += "\\par\\par";
      }
    });

    rtfContent += "}";

    const blob = new Blob([rtfContent], { type: "application/rtf" });
    return { blob, extension: "rtf" };
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
      status: "pending",
    };

    setPdfs((prev) => [...prev, newPDF]);
  }, []);

  const removePDF = (id: string) => {
    setPdfs((prev) => prev.filter((pdf) => pdf.id !== id));
  };

  const convertSinglePDF = async (pdf: UploadedPDF) => {
    setPdfs((prev) =>
      prev.map((p) => (p.id === pdf.id ? { ...p, status: "converting" } : p))
    );

    try {
      const structuredPages = await extractStructuredTextFromPDF(pdf.file);
      console.log("Extracted structured pages:", structuredPages.length);

      const { blob: docxBlob, extension } = await createDocxDocument(
        structuredPages,
        pdf.name
      );

      const downloadUrl = URL.createObjectURL(docxBlob);
      const convertedName = pdf.name.replace(/\.pdf$/i, `.${extension}`);

      setPdfs((prev) =>
        prev.map((p) =>
          p.id === pdf.id
            ? { ...p, status: "completed", downloadUrl, convertedName }
            : p
        )
      );
    } catch (error) {
      console.error("Conversion failed:", error);
      setPdfs((prev) =>
        prev.map((p) => (p.id === pdf.id ? { ...p, status: "error" } : p))
      );
    }
  };

  const convertAllPDFs = async () => {
    if (pdfs.length === 0) {
      alert("Please upload at least 1 PDF file to convert.");
      return;
    }

    setIsConverting(true);

    try {
      for (const pdf of pdfs) {
        if (pdf.status === "pending" || pdf.status === "error") {
          await convertSinglePDF(pdf);
        }
      }
    } catch (error) {
      console.error("Batch conversion failed:", error);
      alert("Some conversions failed. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const downloadFile = (pdf: UploadedPDF) => {
    if (pdf.downloadUrl && pdf.convertedName) {
      const link = document.createElement("a");
      link.href = pdf.downloadUrl;
      link.download = pdf.convertedName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const clearAllPDFs = () => {
    pdfs.forEach((pdf) => {
      if (pdf.downloadUrl) {
        URL.revokeObjectURL(pdf.downloadUrl);
      }
    });
    setPdfs([]);
  };

  const completedCount = pdfs.filter(
    (pdf) => pdf.status === "completed"
  ).length;
  const totalPages = pdfs.reduce((sum, pdf) => sum + (pdf.pageCount || 0), 0);

  const getStatusIcon = (status: UploadedPDF["status"]) => {
    switch (status) {
      case "pending":
        return (
          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
        );
      case "converting":
        return (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-spin">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
          </div>
        );
      case "completed":
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
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
        );
      case "error":
        return (
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
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
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          PDF to DOCX Converter
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
          Convert your PDF files to Word DOCX format preserving the original OCR
          text extraction format. Perfect for maintaining raw text content
          exactly as extracted from the PDF.
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-10">
        <FileUpload
          onFileSelect={handleFileSelect}
          accept="application/pdf"
          maxSize={50 * 1024 * 1024} // 50MB
          description="Add PDF files to convert to DOCX format (PDF format only)"
          multiple={true}
        />
      </div>

      {/* PDF List */}
      {pdfs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-10 border border-gray-100">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-800">
                PDFs to Convert
              </h3>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                {pdfs.length} {pdfs.length === 1 ? "file" : "files"}
              </div>
              {completedCount > 0 && (
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {completedCount} converted
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
                  className="group flex items-center space-x-6 p-5 border-2 border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50/30 transition-all duration-300"
                >
                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {getStatusIcon(pdf.status)}
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
                    {pdf.status === "completed" && (
                      <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border-2 border-white shadow-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                      </div>
                    )}
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
                      <span
                        className={`font-medium ${
                          pdf.status === "completed"
                            ? "text-green-600"
                            : pdf.status === "converting"
                            ? "text-blue-600"
                            : pdf.status === "error"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {pdf.status === "completed"
                          ? "Ready to download"
                          : pdf.status === "converting"
                          ? "Converting..."
                          : pdf.status === "error"
                          ? "Conversion failed"
                          : "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center space-x-2">
                    {pdf.status === "completed" && (
                      <button
                        onClick={() => downloadFile(pdf)}
                        className="w-10 h-10 flex items-center justify-center text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-all duration-300 group/btn"
                        title="Download DOCX"
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
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          ></path>
                        </svg>
                      </button>
                    )}
                    {(pdf.status === "pending" || pdf.status === "error") && (
                      <button
                        onClick={() => convertSinglePDF(pdf)}
                        disabled={isConverting}
                        className="w-10 h-10 flex items-center justify-center text-blue-600 hover:text-blue-700 disabled:opacity-50 hover:bg-blue-100 rounded-lg transition-all duration-300 group/btn"
                        title="Convert to DOCX"
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          ></path>
                        </svg>
                      </button>
                    )}
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

      {/* Convert Button */}
      {pdfs.length > 0 && (
        <div className="text-center space-y-4">
          {isConverting ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <LoadingSpinner message="Converting PDFs to DOCX format..." />
              <p className="text-sm text-gray-500 mt-4">
                Processing {pdfs.length} files with {totalPages} total pages...
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={convertAllPDFs}
                disabled={pdfs.length === 0}
                className="px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:transform-none disabled:hover:shadow-none flex items-center space-x-3 mx-auto"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Convert All to DOCX</span>
              </button>

              {pdfs.length > 0 && (
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>
                      Completed: {completedCount}/{pdfs.length}
                    </span>
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
