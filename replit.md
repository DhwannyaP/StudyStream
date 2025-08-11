# Replit.md

## Overview

This is a full-stack educational platform application that enables teachers to upload and share educational materials with students, and provides real-time collaboration features for interactive learning. The platform supports file uploads (PDFs, presentations, documents, images), real-time messaging, video calling, annotation tools, and study group management. Built with modern web technologies, it provides separate interfaces for teachers and students with role-based access control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Routing**: Wouter for client-side routing with role-based route protection
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation integration

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **File Upload**: Multer middleware with configurable file type restrictions
- **Real-time Communication**: WebSocket server implementation for live collaboration
- **Session Management**: In-memory session storage with Bearer token authentication

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM schema definitions
- **Schema Design**: Separate tables for users, notes, study groups, messages, annotations, and group memberships
- **File Storage**: Local file system storage with configurable upload limits (50MB default)
- **Session Storage**: In-memory Map-based session management for development

### Authentication & Authorization
- **Authentication**: Custom session-based authentication with Bearer tokens
- **Authorization**: Role-based access control (teacher/student roles)
- **Session Management**: Server-side session storage with client-side token persistence
- **Route Protection**: Frontend middleware for role-based route access

### Real-time Features
- **WebSocket Management**: Custom SocketManager class for connection handling and reconnection
- **Live Collaboration**: Real-time cursor tracking, annotations, and messaging
- **Video Calling**: WebRTC implementation with STUN server configuration
- **Chat System**: Real-time messaging with AI-powered content moderation

### Content Management
- **File Processing**: Support for multiple file types (PDF, PPT, DOC, images)
- **Content Moderation**: OpenAI GPT-4o integration for educational chat moderation
- **Annotation System**: Real-time collaborative annotations on educational materials
- **View Tracking**: Analytics for content engagement and usage patterns

### Development Tools
- **Build System**: Vite with TypeScript compilation and hot module replacement
- **Development Server**: Express middleware integration with Vite dev server
- **Database Migrations**: Drizzle Kit for schema migrations and database management
- **Code Quality**: TypeScript strict mode with ESLint configuration

## External Dependencies

### Database & ORM
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database operations with schema validation
- **Drizzle Kit**: Migration management and schema synchronization

### UI & Design System
- **Radix UI**: Accessible component primitives for form controls, dialogs, and navigation
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Component variant management

### Real-time & Communication
- **WebSocket (ws)**: Native WebSocket implementation for real-time features
- **WebRTC**: Browser-based peer-to-peer video calling capabilities

### AI & Content Moderation
- **OpenAI API**: GPT-4o model integration for educational content moderation
- **Custom Moderation**: Configurable content filtering for educational appropriateness

### File Handling
- **Multer**: Multipart form data handling for file uploads
- **File Type Validation**: Extension-based file type restrictions for security

### Development & Build Tools
- **Vite**: Fast build tool with plugin ecosystem
- **TypeScript**: Static type checking and enhanced developer experience
- **React Query**: Server state management with caching and synchronization
- **React Hook Form**: Performant form handling with validation integration