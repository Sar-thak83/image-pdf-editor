// "use client";

// import { useState } from "react";
// import BackgroundRemover from "./components/BackgroundRemover";
// import BackgroundChanger from "./components/BackgroundChanger";
// import ImageToPDF from "./components/ImageToPDF";

// export default function Home() {
//   const [activeTab, setActiveTab] = useState<"remover" | "changer" | "pdf">(
//     "remover"
//   );

//   const tabs = [
//     { id: "remover", label: "Remove Background", icon: "🖼️" },
//     { id: "changer", label: "Change Background", icon: "🎨" },
//     { id: "pdf", label: "Images to PDF", icon: "📄" },
//   ] as const;

//   return (
//     <main className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="gradient-bg text-white py-8">
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
//           <div className="flex justify-center space-x-8">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`py-4 px-6 text-lg font-medium transition-all duration-200 border-b-2 ${
//                   activeTab === tab.id
//                     ? "text-blue-600 border-blue-600"
//                     : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
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
//       </div>

//       {/* Footer */}
//       <footer className="bg-gray-800 text-white py-8 mt-16">
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "remover" | "changer" | "pdf" | "merger"
  >("remover");

  const tabs = [
    { id: "remover", label: "Remove Background", icon: "🖼️" },
    { id: "changer", label: "Change Background", icon: "🎨" },
    { id: "pdf", label: "Images to PDF", icon: "📄" },
    { id: "merger", label: "Merge PDFs", icon: "📑" },
  ] as const;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-bg text-white py-8">
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
          <div className="flex justify-center space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 text-lg font-medium transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
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
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
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
