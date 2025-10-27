# Image & PDF Editor

A privacy-first web application for photo editing and PDF manipulation. All processing happens in your browser — no uploads, no server, no data collection.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

## Features

- **Background Removal** — Remove image backgrounds with AI, export as transparent PNG
- **Background Changer** — Apply solid colors with passport/visa photo presets (white, blue, red, grey)
- **Image to PDF** — Combine multiple JPG/PNG images into a single PDF document
- **PDF Tools** — Merge, split, and convert PDFs (coming soon)
- **Privacy First** — All processing runs locally in your browser using WebAssembly and TensorFlow.js

## Live Demo

🔗 **[Try it now](https://image-pdf-editor-sar-thak83.netlify.app/)** — No signup required!

## Quick Start

### Prerequisites

- Node.js 18.x or higher ([Download](https://nodejs.org/))
- npm, yarn, or pnpm

### Local Development

```bash
# Clone the repository
git clone https://github.com/Sar-thak83/image-pdf-editor.git
cd image-pdf-editor

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm start
```

## Deployment

### Deploy to Netlify

1. **Connect your repository** to Netlify
2. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18.x`

The app will auto-deploy on every push to `main`.


## Technology Stack

- **Framework:** [Next.js 15](https://nextjs.org/) with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **AI Models:** TensorFlow.js, MediaPipe Selfie Segmentation
- **PDF Processing:** pdf-lib, jsPDF
- **Icons:** Lucide React

## Project Structure

```
image-pdf-editor/
├── app/                    # Next.js App Router
│   ├── components/         # React components
│   ├── utils/              # Helper functions
│   └── page.tsx            # Home page
├── public/                 # Static assets
├── .nvmrc                  # Node version specification
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── package.json            # Dependencies and scripts
```

## Troubleshooting

### Build Failures

**ESLint/TypeScript errors blocking deployment?**

Add this to `next.config.js`:

```javascript
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
```

## Roadmap

- [ ] PDF splitting and merging
- [ ] PDF to DOCX conversion
- [ ] Batch image processing
- [ ] Custom background uploads
- [ ] Image filters and adjustments
- [ ] PWA support for offline use

## Privacy & Security

- ✅ **No data leaves your device** — all processing is client-side
- ✅ **No cookies or tracking** — we don't collect analytics
- ✅ **No uploads** — files stay in your browser's memory
- ✅ **Open source** — audit the code yourself

