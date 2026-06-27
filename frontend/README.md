# PRISM - AI Recruitment Intelligence Platform

A luxury enterprise AI dashboard for analyzing candidate profiles through a seven-stage intelligence pipeline.

This repository contains the complete backend implementation and processing pipeline. The live deployment serves a representative subset of processed candidates to provide fast response times under free-tier hosting constraints. The full processed dataset and backend artifacts are available separately. Running the backend locally reproduces the complete pipeline.

## Tech Stack

- **React 19** - Modern UI framework
- **TypeScript** - Type safety
- **Vite** - Next-gen build tool
- **Tailwind CSS v4** - Utility-first styling
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Recharts** - Data visualization

## Features

### Pages
- **Landing** - Hero page with feature overview
- **Analyze** - Pipeline visualization with progress tracking
- **Dashboard** - KPI metrics, charts, and executive summary
- **Candidates** - Enterprise data table with search, filters, and drawer
- **Compare** - Side-by-side candidate comparison
- **Insights** - Market analytics and trend analysis
- **Pipeline** - 7-stage processing pipeline explorer
- **Settings** - Account and preferences management

### Design System
- Dark mode luxury enterprise aesthetic
- Glassmorphism effects
- Custom color palette in OKLCH
- Smooth animations and transitions
- Responsive design (mobile, tablet, desktop)
- Premium typography (Space Grotesk, Inter, JetBrains Mono)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── GlassCard.tsx
│   ├── KPICard.tsx
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── CandidateTable.tsx
│   ├── CandidateDrawer.tsx
│   ├── Charts.tsx
│   ├── RadarChart.tsx
│   ├── Pipeline.tsx
│   ├── Button.tsx
│   └── RecommendationCard.tsx
├── pages/              # Page components
│   ├── LandingPage.tsx
│   ├── AnalyzePage.tsx
│   ├── DashboardPage.tsx
│   ├── CandidatesPage.tsx
│   ├── ComparePage.tsx
│   ├── InsightsPage.tsx
│   ├── PipelinePage.tsx
│   └── SettingsPage.tsx
├── App.tsx            # Main app component with routing
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## Design Details

### Color Palette
- **Background**: `oklch(0.16 0.012 260)`
- **Foreground**: `oklch(0.97 0.005 250)`
- **Primary**: `oklch(0.62 0.21 268)`
- **Accent Cyan**: `oklch(0.78 0.14 210)`
- **Emerald**: `oklch(0.74 0.16 162)`
- **Amber**: `oklch(0.82 0.16 78)`
- **Crimson**: `oklch(0.65 0.22 22)`

### Typography
- **Display**: Space Grotesk
- **Body**: Inter
- **Numbers**: JetBrains Mono

## Features Highlights

- **Hero Background**: Animated grid with neural network visualization
- **Glassmorphism**: Frosted glass effects with blur
- **Responsive**: Works seamlessly on all screen sizes
- **Animations**: Smooth transitions with Framer Motion
- **Dark Mode**: Premium dark theme only
- **Interactive Charts**: Real-time data visualization
- **Advanced Table**: Sortable, searchable candidate explorer
- **Drawer UI**: Smooth side panel for candidate details
- **Pipeline Visualization**: Stage-by-stage processing display

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - PRISM Platform
