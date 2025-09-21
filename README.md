# NoteKeep - Privacy-First Notes & Markdown Editor

## Overview

NoteKeep is a privacy-first notes manager designed for text, Markdown, and quick information capture. It combines simplicity, encryption, and powerful organization tools while following the MinimalAuth principle of requiring only username and password for registration, with a recovery key generated for account recovery. The application provides a rich text editing experience with Markdown support, folder organization, tagging system, and secure client-side encryption.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS custom properties for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with in-memory storage for development
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **API Design**: RESTful API endpoints with JSON responses
- **Development Tools**: TSX for TypeScript execution and hot reloading

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development and database implementation for production

### Authentication and Authorization
- **Registration**: Username and password only, with auto-generated recovery key and encryption key
- **Login**: Session-based authentication with secure password verification
- **Password Recovery**: Recovery key-based password reset system
- **Encryption**: Client-side encryption using CryptoJS for note content protection
- **Session Security**: HTTP-only cookies with configurable expiration

### Core Features Architecture
- **Note Management**: Full CRUD operations with Markdown support and real-time preview
- **Organization**: Hierarchical folder system with emoji support and tagging
- **Search**: Full-text search across note titles and content
- **Export**: Multiple export formats (Markdown, plain text, PDF) using jsPDF
- **Editor**: Split-view Markdown editor with syntax highlighting and live preview

## External Dependencies

### Database and ORM
- **@neondatabase/serverless**: Serverless PostgreSQL database driver for Neon
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **drizzle-kit**: CLI tool for database migrations and schema management

### UI and Design System
- **@radix-ui/***: Comprehensive set of accessible UI primitives (accordion, dialog, dropdown-menu, etc.)
- **lucide-react**: Icon library for consistent iconography
- **class-variance-authority**: Utility for creating component variants
- **tailwindcss**: Utility-first CSS framework with PostCSS integration

### Form Handling and Validation
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for React Hook Form
- **zod**: TypeScript-first schema validation library
- **drizzle-zod**: Integration between Drizzle ORM and Zod for schema validation

### Text Processing and Export
- **marked**: Markdown parser and compiler
- **dompurify**: HTML sanitizer for secure Markdown rendering
- **jspdf**: PDF generation library for note exports
- **crypto-js**: Client-side encryption and decryption utilities

### Development and Build Tools
- **@vitejs/plugin-react**: Vite plugin for React support
- **@replit/vite-plugin-***: Replit-specific development plugins for error overlay and dev tools
- **typescript**: Type checking and compilation
- **date-fns**: Date utility library for formatting timestamps

### Server and Security
- **express**: Web application framework
- **express-session**: Session middleware for authentication
- **bcrypt**: Password hashing library for secure authentication
- **connect-pg-simple**: PostgreSQL session store for production deployments