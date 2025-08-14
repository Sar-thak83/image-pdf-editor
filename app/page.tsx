// "use client";

// import { useState } from "react";
// import BackgroundRemover from "./components/BackgroundRemover";
// import BackgroundChanger from "./components/BackgroundChanger";
// import ImageToPDF from "./components/ImageToPDF";
// import PDFMerger from "./components/MergePDFs";
// import SplitPDF from "./components/SplitPDF";

// export default function Home() {
//   const [activeTab, setActiveTab] = useState<
//     "remover" | "changer" | "pdf" | "merger" | "splitter"
//   >("remover");

//   const tabs = [
//     { id: "remover", label: "Remove Background", icon: "🖼️" },
//     { id: "changer", label: "Change Background", icon: "🎨" },
//     { id: "pdf", label: "Images to PDF", icon: "📄" },
//     { id: "merger", label: "Merge PDFs", icon: "📑" },
//     { id: "splitter", label: "Split PDF", icon: "✂️" },
//   ] as const;

//   return (
//     <main className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
//         <div className="container mx-auto px-4">
//           <h1 className="text-4xl font-bold text-center mb-2">Photo Tools</h1>
//           <p className="text-xl text-center opacity-90">
//             Professional photo editing tools for ID photos, backgrounds, and PDF
//             conversion
//           </p>
//         </div>
//       </header>

//       {/* Navigation Tabs */}
//       <nav className="bg-white shadow-sm border-b">
//         <div className="container mx-auto px-4">
//           <div className="flex justify-center space-x-6 overflow-x-auto">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`py-4 px-4 text-base font-medium transition-all duration-300 border-b-2 whitespace-nowrap ${
//                   activeTab === tab.id
//                     ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 border-blue-600 transform scale-105"
//                     : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 hover:scale-102"
//                 }`}
//               >
//                 <span className="mr-2">{tab.icon}</span>
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       </nav>

//       {/* Content */}
//       <div className="container mx-auto px-4 py-8">
//         {activeTab === "remover" && <BackgroundRemover />}
//         {activeTab === "changer" && <BackgroundChanger />}
//         {activeTab === "pdf" && <ImageToPDF />}
//         {activeTab === "merger" && <PDFMerger />}
//         {activeTab === "splitter" && (
//           <SplitPDF
//             onSplitComplete={(files) => {
//               console.log("PDF split complete:", files);
//               // You can add additional handling here like:
//               // - Show success notification
//               // - Download files automatically
//               // - Upload to cloud storage
//             }}
//             maxFileSize={50 * 1024 * 1024} // 50MB
//           />
//         )}
//       </div>

//       {/* Footer */}
//       <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 mt-16">
//         <div className="container mx-auto px-4 text-center">
//           <p className="text-gray-400">
//             © 2024 Photo Tools. All processing happens locally in your browser
//             for privacy.
//           </p>
//         </div>
//       </footer>
//     </main>
//   );
// }
"use client";

import { useState } from "react";
import BackgroundRemover from "./components/BackgroundRemover";
import BackgroundChanger from "./components/BackgroundChanger";
import ImageToPDF from "./components/ImageToPDF";
import PDFMerger from "./components/MergePDFs";
import SplitPDF from "./components/SplitPDF";
import PDFToDocxConverter from "./components/pdfToDocx";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "remover" | "changer" | "pdf" | "merger" | "splitter" | "converter"
  >("remover");

  const tabs = [
    { id: "remover", label: "Remove Background", icon: "🖼️" },
    { id: "changer", label: "Change Background", icon: "🎨" },
    { id: "pdf", label: "Images to PDF", icon: "📄" },
    { id: "merger", label: "Merge PDFs", icon: "📑" },
    { id: "splitter", label: "Split PDF", icon: "✂️" },
    { id: "converter", label: "PDF to DOCX", icon: "📝" },
  ] as const;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-2">Photo Tools</h1>
          <p className="text-xl text-center opacity-90">
            Professional photo editing tools for ID photos, backgrounds, and PDF
            conversion
          </p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 text-base font-medium transition-all duration-300 border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 border-blue-600 transform scale-105"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 hover:scale-102"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "remover" && <BackgroundRemover />}
        {activeTab === "changer" && <BackgroundChanger />}
        {activeTab === "pdf" && <ImageToPDF />}
        {activeTab === "merger" && <PDFMerger />}
        {activeTab === "splitter" && (
          <SplitPDF
            onSplitComplete={(files) => {
              console.log("PDF split complete:", files);
              // You can add additional handling here like:
              // - Show success notification
              // - Download files automatically
              // - Upload to cloud storage
            }}
            maxFileSize={50 * 1024 * 1024} // 50MB
          />
        )}
        {activeTab === "converter" && <PDFToDocxConverter />}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 Photo Tools. All processing happens locally in your browser
            for privacy.
          </p>
        </div>
      </footer>
    </main>
  );
}
