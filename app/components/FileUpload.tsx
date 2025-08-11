// "use client";

// import { useCallback, useState } from "react";

// interface FileUploadProps {
//   onFileSelect: (file: File) => void;
//   accept: string;
//   maxSize: number;
//   description: string;
//   multiple?: boolean;
// }

// export default function FileUpload({
//   onFileSelect,
//   accept,
//   maxSize,
//   description,
//   multiple = false,
// }: FileUploadProps) {
//   const [isDragActive, setIsDragActive] = useState(false);

//   const handleDrop = useCallback(
//     (e: React.DragEvent<HTMLDivElement>) => {
//       e.preventDefault();
//       setIsDragActive(false);

//       const files = Array.from(e.dataTransfer.files);
//       files.forEach((file) => {
//         if (file.size <= maxSize && file.type.startsWith("image/")) {
//           onFileSelect(file);
//         }
//       });
//     },
//     [onFileSelect, maxSize]
//   );

//   const handleFileInput = useCallback(
//     (e: React.ChangeEvent<HTMLInputElement>) => {
//       const files = Array.from(e.target.files || []);
//       files.forEach((file) => {
//         if (file.size <= maxSize) {
//           onFileSelect(file);
//         }
//       });
//       e.target.value = ""; // Reset input
//     },
//     [onFileSelect, maxSize]
//   );

//   const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     setIsDragActive(true);
//   }, []);

//   const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     setIsDragActive(false);
//   }, []);

//   return (
//     <div
//       className={`upload-area ${
//         isDragActive ? "drag-active" : ""
//       } rounded-lg p-12 text-center cursor-pointer transition-all duration-300 hover:shadow-lg`}
//       onDrop={handleDrop}
//       onDragOver={handleDragOver}
//       onDragLeave={handleDragLeave}
//       onClick={() => document.getElementById("file-input")?.click()}
//     >
//       <input
//         id="file-input"
//         type="file"
//         accept={accept}
//         onChange={handleFileInput}
//         multiple={multiple}
//         className="hidden"
//       />

//       <div className="space-y-4">
//         <div className="text-6xl">📤</div>
//         <div>
//           <h3 className="text-2xl font-semibold text-gray-800 mb-2">
//             {isDragActive ? "Drop your files here" : "Upload your images"}
//           </h3>
//           <p className="text-gray-600 mb-4">{description}</p>
//           <p className="text-sm text-gray-500">
//             Drag and drop or click to browse • Max size:{" "}
//             {Math.round(maxSize / 1024 / 1024)}MB
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useCallback, useState } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept: string;
  maxSize: number;
  description: string;
  multiple?: boolean;
}

export default function FileUpload({
  onFileSelect,
  accept,
  maxSize,
  description,
  multiple = false,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => {
        if (file.size <= maxSize && file.type.startsWith("image/")) {
          onFileSelect(file);
        }
      });
    },
    [onFileSelect, maxSize]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => {
        if (file.size <= maxSize) {
          onFileSelect(file);
        }
      });
      e.target.value = ""; // Reset input
    },
    [onFileSelect, maxSize]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-16 text-center cursor-pointer 
        transition-all duration-500 transform hover:scale-[1.02] group
        ${
          isDragActive
            ? "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-3 border-dashed border-blue-400 shadow-2xl scale-105"
            : "bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 border-2 border-dashed border-gray-300 hover:border-blue-400 shadow-xl hover:shadow-2xl"
        }
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 left-4 w-8 h-8 bg-blue-400 rounded-full animate-bounce"></div>
        <div
          className="absolute top-8 right-8 w-6 h-6 bg-purple-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="absolute bottom-8 left-8 w-5 h-5 bg-pink-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.4s" }}
        ></div>
        <div
          className="absolute bottom-4 right-4 w-7 h-7 bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.6s" }}
        ></div>
      </div>

      <input
        id="file-input"
        type="file"
        accept={accept}
        onChange={handleFileInput}
        multiple={multiple}
        className="hidden"
      />

      <div className="relative z-10 space-y-6">
        {/* Icon Section */}
        <div className="relative">
          <div
            className={`
            w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl
            transition-all duration-500 transform group-hover:scale-110
            ${
              isDragActive
                ? "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl animate-pulse"
                : "bg-gradient-to-br from-gray-200 via-blue-200 to-purple-200 group-hover:from-blue-400 group-hover:via-purple-400 group-hover:to-pink-400 shadow-lg"
            }
          `}
          >
            {isDragActive ? (
              <svg
                className="w-10 h-10 text-white animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                ></path>
              </svg>
            ) : (
              <svg
                className={`w-10 h-10 transition-colors duration-300 ${
                  isDragActive
                    ? "text-white"
                    : "text-gray-600 group-hover:text-white"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
            )}
          </div>

          {/* Floating Animation Ring */}
          <div
            className={`
            absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-dashed 
            transition-all duration-700 transform group-hover:scale-125 group-hover:rotate-180
            ${
              isDragActive
                ? "border-blue-400 animate-spin"
                : "border-gray-300 group-hover:border-blue-400"
            }
          `}
          ></div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h3
            className={`
            text-3xl font-bold transition-all duration-300
            ${
              isDragActive
                ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                : "text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-pink-600"
            }
          `}
          >
            {isDragActive ? "Drop your files here!" : "Upload your images"}
          </h3>

          <p
            className={`text-lg font-medium transition-colors duration-300 ${
              isDragActive ? "text-gray-700" : "text-gray-600"
            }`}
          >
            {description}
          </p>

          <div className="space-y-2">
            <div
              className={`
              inline-flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-semibold
              transition-all duration-300 transform group-hover:scale-105
              ${
                isDragActive
                  ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-white/80 text-gray-600 border border-gray-200 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-pink-500 group-hover:text-white group-hover:border-transparent shadow-md"
              }
            `}
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
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                ></path>
              </svg>
              <span>Drag and drop or click to browse</span>
            </div>

            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>Max size: {Math.round(maxSize / 1024 / 1024)}MB</span>
              </div>

              {multiple && (
                <div className="flex items-center space-x-1">
                  <svg
                    className="w-4 h-4 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    ></path>
                  </svg>
                  <span>Multiple files supported</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="pt-4 border-t border-gray-200/50">
          <p className="text-xs text-gray-500 font-medium">
            Supported formats: JPG, PNG, WebP, GIF
          </p>
          <div className="flex justify-center mt-2 space-x-2">
            {["JPG", "PNG", "WebP", "GIF"].map((format, index) => (
              <span
                key={format}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md font-mono"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Shimmer Effect */}
      <div
        className={`
        absolute inset-0 -top-2 -left-2 w-full h-full
        bg-gradient-to-r from-transparent via-white/20 to-transparent
        transform -skew-x-12 transition-transform duration-1000
        ${
          isDragActive
            ? "translate-x-full"
            : "group-hover:translate-x-full -translate-x-full"
        }
      `}
      ></div>
    </div>
  );
}
