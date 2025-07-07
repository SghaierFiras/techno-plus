# Bilingual Inventory Management System

A modern, offline-first inventory and store management system built with React, TypeScript, and Supabase.

## Features

- **Bilingual Support**: Full French and English translations
- **Progressive Web App**: Works offline with service worker caching
- **Barcode Scanning**: Ready for barcode integration
- **Modern UI**: Tailwind CSS with responsive design
- **Offline-First**: Local storage with sync capabilities
- **Modular Architecture**: Easy to extend with new features

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Internationalization**: i18next, react-i18next
- **PWA**: Vite PWA plugin with Workbox
- **Routing**: React Router v6
- **Icons**: Lucide React

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials.

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── layout/         # Layout components (Header, Sidebar, etc.)
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization
│   └── locales/        # Translation files
├── lib/                # Utilities and configurations
├── pages/              # Page components
└── types/              # TypeScript type definitions
```

## Offline Support

The application includes comprehensive offline support:

- **Service Worker**: Caches app shell and API responses
- **Local Storage**: Stores data locally with sync queue
- **Online Status**: Visual indicators for connection status
- **Sync Queue**: Queues actions when offline for later sync

## Internationalization

Easy language switching between English and French:

- **Translation Files**: Located in `src/i18n/locales/`
- **Language Hook**: `useLanguage()` for language management
- **Persistent**: Language preference saved to localStorage

## Next Steps

The foundation is now ready for feature development. Each module will be built incrementally:

1. **Inventory Management** - Product CRUD, barcode scanning
2. **Sales Module** - Point of sale, transaction management
3. **Customer Management** - Customer database, purchase history
4. **Reporting** - Sales reports, inventory analytics
5. **Settings** - App configuration, user preferences

## Contributing

This project follows a modular development approach. Each feature is built as a separate module with its own components, hooks, and utilities.