# image-pdf-editor

Small, privacy-first web app (Next.js + TypeScript) to edit photos and export PDFs. All processing runs in the browser — no server required.

## Summary

- Background remover (transparent PNG)
- Background changer with passport/visa color presets
- Convert multiple images (JPG/PNG) into a single PDF
- Responsive UI with drag-and-drop and reorder support

## Quick start (local)

1. Install Node 18 and use it:
   ```bash
   nvm install 18 && nvm use 18
   ```
2. Install dependencies and run dev server:
   ```bash
   npm ci
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   npm run preview
   ```

## Netlify / CI notes

- Ensure package.json contains a "build" script and a lockfile (package-lock.json / yarn.lock / pnpm-lock.yaml) is committed.
- Force Node 18 for Netlify with one of:
  - Add an `.nvmrc` containing `18` at repo root
  - Add in package.json: `"engines": { "node": "18.x" }`
  - Set environment variable NODE_VERSION = 18 in Netlify site settings
- After changes, push to main and re-deploy. If the build fails, copy the full "Installing dependencies" / "Running build" error output for diagnosis.

## Troubleshooting (common)

- "No build script": add `"build": "next build"` (or the correct command) to package.json.
- Node version mismatch: use .nvmrc / engines or set NODE_VERSION in CI.
- Missing files/imports: ensure src/, public/, and assets referenced by code are committed.
- If a bundler error names a missing package, confirm it exists in package.json and lockfile is committed.

## Project structure (high level)

- app/ or pages/ — Next.js app router / pages
- src/ — TypeScript source
- public/ — static assets
- styles/ — Tailwind / global styles

## Contributing

- Bug reports and PRs welcome. Keep changes small and focused.

## License

- MIT

## Developer Portfolio (example)

# Developer Portfolio

A modern, responsive portfolio website built with Next.js, React, and Tailwind CSS.

## Features

- **Hero Section** - Eye-catching introduction with profile image and social links
- **About** - Personal background and professional summary
- **Skills** - Organized by Languages, Frameworks, Libraries, Databases, Tools, and Platforms
- **Projects** - Showcase of work with multi-category filtering
- **Experience** - Professional work history and achievements
- **Certifications** - Relevant certifications and credentials
- **Dark Mode** - Seamless light/dark theme switching
- **Responsive Design** - Optimized for all devices

## Tech Stack

- **Framework**: Next.js 
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Language**: TypeScript
- **Animations**: Smooth transitions and scroll reveals

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install` or `pnpm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Customization

- Update personal information in data files (`lib/skills-data.ts`, `lib/projects-data.ts`, etc.)
- Modify colors and theme in `app/globals.css`
- Replace profile images in the `public` folder
- Update social media links in `components/hero-section.tsx`

## Deployment

Deploy easily to Vercel with one click or use any Node.js hosting platform.
