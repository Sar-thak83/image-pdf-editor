# Photo Tools Web Application

A modern, TypeScript-based web application built with Next.js that provides three essential photo editing tools:

## Features

### 🖼️ Background Remover

- Instantly remove backgrounds from any uploaded photo
- Perfect for ID photos, passport pictures, or professional headshots
- AI-powered background detection and removal
- Download results as PNG with transparency

### 🎨 Background Changer for Passport Photos

- Replace backgrounds with official colors (white, light blue, light gray, cream)
- Specifically designed for passport and visa photo requirements
- Easy color selection with preview
- Professional-quality output

### 📄 Image to PDF Converter

- Convert multiple images into a single PDF document
- Support for JPG and PNG formats (up to 10MB each)
- Drag-and-drop interface with reordering capabilities
- Perfect for document compilation and photo albums

## Technical Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **PDF Generation:** jsPDF
- **Image Processing:** Canvas API with custom algorithms

## Key Features

- ✅ **No Registration Required** - All features available instantly
- ✅ **Privacy-First** - All processing happens locally in your browser
- ✅ **Responsive Design** - Works perfectly on desktop and mobile
- ✅ **Drag-and-Drop Support** - Intuitive file upload experience
- ✅ **Real-time Processing** - Fast image processing with progress feedback
- ✅ **Professional Output** - High-quality results suitable for official documents

## Installation

1. Clone the repository:
   \`\`\`bash
   git clone <repository-url>
   cd photo-tools-app
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
├── app/
│ ├── components/ # React components
│ │ ├── BackgroundRemover.tsx
│ │ ├── BackgroundChanger.tsx
│ │ ├── ImageToPDF.tsx
│ │ ├── FileUpload.tsx
│ │ └── LoadingSpinner.tsx
│ ├── utils/ # Utility functions
│ │ ├── backgroundRemoval.ts
│ │ └── pdfConverter.ts
│ ├── globals.css # Global styles
│ ├── layout.tsx # Root layout
│ └── page.tsx # Home page
├── public/ # Static assets
├── package.json
├── tailwind.config.js
├── next.config.js
└── README.md
\`\`\`

## Usage

### Background Remover

1. Upload an image (JPG, PNG, up to 10MB)
2. Wait for automatic background removal
3. Download the result with transparent background

### Background Changer

1. Upload a photo
2. Select from preset background colors
3. Click "Change Background"
4. Download the professional result

### Image to PDF

1. Upload multiple images
2. Reorder them as needed
3. Click "Convert to PDF"
4. Download the compiled PDF document

## Browser Compatibility

- Modern browsers with Canvas API support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported
