# Digital Book PDF Viewer

## Overview

This is a modern digital book PDF viewer application that allows users to browse a library of PDF books, view them with persistent highlighting capabilities, and manage their annotations. The application features a licensing system for book access, a clean dark-themed interface following Fluent Design principles, and local storage for highlights that can be exported and imported.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter for lightweight client-side routing with two main routes:
- `/` - Library view displaying available books
- `/visor/:bookId` - PDF viewer for a specific book

**State Management**: React hooks for local component state, with TanStack Query (React Query) configured for potential server-side data fetching (currently minimal API usage).

**UI Components**: Shadcn UI component library with Radix UI primitives, providing a comprehensive set of accessible, customizable components. Uses Tailwind CSS for styling with a custom design system based on CSS variables for theming.

**Design System**: 
- Dark theme prioritized with Fluent Design influences
- Custom color system using HSL values with CSS custom properties
- Typography scale using Inter for UI and JetBrains Mono for technical info
- Consistent spacing using Tailwind's spacing units (2, 3, 4, 6, 8)
- Two-column layout: fixed 280px sidebar + flexible content area

### PDF Rendering

**Library**: PDF.js for client-side PDF rendering using canvas elements.

**Approach**: 
- Loads PDF documents from static files in `/client/public/libros/`
- Renders individual pages to canvas elements
- Manages page navigation and display scaling
- Uses CDN-hosted worker for PDF.js operations

### Data Storage

**Client-Side Storage**: LocalStorage for persisting user data:
- Highlight annotations per book (stored with book ID as key)
- Unlocked books list (licensing system)

**Data Structure**:
- Highlights include normalized coordinates, color, timestamp, and original canvas dimensions for responsive scaling
- Books metadata loaded from static JSON configuration (`books.json`)

**No Server Database**: Currently uses in-memory storage pattern on server-side (MemStorage class) but server routes are minimal/unused. The application is primarily client-side driven.

### Highlighting System

**Canvas Overlay Approach**: Transparent overlay div positioned above PDF canvas to capture drawing interactions.

**Coordinate Normalization**: Highlights are stored with normalized coordinates (0-1 range) relative to canvas dimensions, allowing them to scale correctly when canvas size changes.

**Features**:
- Multiple color options (6 predefined colors from HIGHLIGHT_COLORS constant)
- Drawing mode toggle (view mode vs. drawing mode)
- Per-page highlight storage and rendering
- Rectangle-based highlighting with mouse drag interactions
- Clear highlights for current page
- Export/import functionality via JSON files

### Book Licensing System

**License Validation**: Simple license key system where each book has a required license string.

**Storage**: Unlocked book IDs stored in LocalStorage array.

**Access Control**: Books require valid license input before viewing in PDF viewer. Library page shows lock icons for locked books.

### Component Structure

**Key Components**:
- `Library` - Displays book grid, handles licensing, search filtering
- `PDFViewer` - Main viewer with canvas rendering and highlight management  
- `PDFSidebar` - Navigation controls, drawing tools, export/import actions
- `HighlightOverlay` - Canvas overlay for drawing and rendering highlights
- `ColorPicker` - Color selection UI for highlight colors

**Layout Pattern**: Sidebar + content area layout with responsive considerations (collapsible sidebar for tablet/mobile).

## External Dependencies

### Third-Party Services

**PDF.js CDN**: Uses `cdn.jsdelivr.net` to load PDF.js worker (`pdf.worker.min.mjs`). This avoids bundling the large worker file and improves initial load performance.

### UI Libraries

**Shadcn/UI + Radix UI**: Complete component library providing:
- Dialog, Popover, Dropdown, Toast notifications
- Form controls (Input, Button, Switch, Checkbox)
- Layout components (Card, Separator, Tabs)
- Accessible primitives from Radix UI

**Lucide React**: Icon library for UI icons throughout the application.

### Build and Development Tools

**Vite**: Build tool and dev server with:
- React plugin for Fast Refresh
- Path aliases (@, @shared, @assets)
- Runtime error overlay
- Replit-specific plugins (cartographer, dev-banner) in development

**TypeScript**: Strict mode enabled with ESNext modules and DOM types.

**Tailwind CSS**: Utility-first CSS framework with custom configuration:
- Custom color system via CSS variables
- Extended border radius values
- Custom spacing and typography scales

### Validation and Forms

**Zod**: Schema validation library used for:
- Data validation in shared schema definitions
- Book configuration validation
- Highlight data structure validation

**Drizzle + Drizzle-Zod**: ORM configured for PostgreSQL but currently unused (schema defined but no active database connection in the application flow).

**React Hook Form**: Form management library with Zod resolvers (dependency present but minimal usage in current codebase).

### Server Framework

**Express.js**: Node.js web framework configured for:
- Serving static files (production build)
- Vite middleware integration (development)
- API route registration (currently minimal/unused routes)
- Session management capability (connect-pg-simple present but unused)

**Note**: Server-side functionality is minimal. The application primarily operates as a static file server with client-side logic.