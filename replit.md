# Earnings Tracker Application

## Overview

This is a full-stack web application built to track weekly earnings from ride-sharing platforms (Bolt and Uber). The application provides a clean interface for managing earnings data with automatic calculations for platform fees, deductions, and net earnings. It's designed specifically for tracking earnings in Romanian Lei (RON) with timezone support for Europe/Bucharest.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server components:

- **Frontend**: React-based single-page application built with Vite
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Deployment**: Replit-optimized with autoscale deployment target

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Single `weekly_earnings` table with comprehensive earnings tracking
- **Validation**: Zod schemas for runtime type checking and validation
- **Migrations**: Managed through Drizzle Kit

### Backend Architecture
- **Express.js**: RESTful API server with middleware for logging and error handling
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development
- **API Endpoints**: 
  - GET `/api/earnings/current` - Fetch current week earnings
  - GET `/api/earnings/previous` - Fetch previous week earnings  
  - PATCH `/api/earnings/current` - Update current week earnings
- **Automatic Calculations**: Platform fees (10%), fixed deductions (25/45 RON), net earnings

### Frontend Architecture
- **React 18**: Modern React with hooks and functional components
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React icon library

### Development Tools
- **TypeScript**: Full type safety across the stack
- **Vite**: Fast development server and build tool
- **Path Aliases**: Configured for clean imports (@/, @shared/)
- **Hot Reload**: Development environment with runtime error overlay

## Data Flow

1. **User Input**: Users enter earnings data through form inputs
2. **Client Validation**: Zod schemas validate data on the client side
3. **API Request**: TanStack Query manages HTTP requests to the backend
4. **Server Processing**: Express routes handle requests and validate data
5. **Database Operations**: Drizzle ORM performs type-safe database operations
6. **Automatic Calculations**: Server calculates derived values (fees, net earnings)
7. **Response**: Updated data is returned to the client
8. **UI Updates**: React components re-render with new data

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web framework for the API server
- **react**: Frontend framework
- **@tanstack/react-query**: Server state management

### UI/UX Dependencies
- **@radix-ui/react-***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Utility for managing component variants

### Development Dependencies
- **typescript**: Type checking and development tooling
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for server development

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Build Process**: `npm run build` - Builds both client and server
- **Production Start**: `npm run start` - Runs the production server
- **Development**: `npm run dev` - Starts development server with hot reload
- **Port Configuration**: Server runs on port 5000, exposed on port 80
- **Database**: PostgreSQL 16 module enabled in Replit environment
- **Auto-scaling**: Configured for autoscale deployment target

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment setting (development/production)

## Changelog

- June 26, 2025: Initial setup
- June 26, 2025: Application completed with all features working:
  - Weekly earnings tracker with automatic Sunday resets (GMT+2)
  - Separate inputs for Bolt and Uber total/cash earnings
  - Automatic calculations: Fleet Commission (10%), Fixed Deduction (25/45 RON), Net Earnings
  - RON currency formatting and Romanian timezone support
  - Real-time updates with debounced saving
  - Previous week comparison with difference display
  - Proper calculation logic: Total earnings include cash, net earnings exclude cash, threshold based on total earnings

## User Preferences

Preferred communication style: Simple, everyday language.