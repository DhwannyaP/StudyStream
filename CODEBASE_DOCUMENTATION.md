# EduCollab - Educational Collaboration Platform

## Overview

EduCollab is a comprehensive educational platform designed for college environments that enables seamless collaboration between teachers and students. The platform features real-time collaboration tools, AI-moderated communication, file sharing, and interactive study group management.

## Key Features

### 🎯 Core Functionality
- **Role-based Access**: Separate interfaces for teachers and students with appropriate permissions
- **File Management**: Upload and share educational materials (PDFs, presentations, documents, images)
- **Real-time Collaboration**: Live cursors, highlighting, annotations, and presence indicators
- **AI Moderation**: OpenAI-powered chat moderation for educational appropriateness
- **Study Groups**: Create and manage collaborative study sessions

### 🔧 Technical Highlights
- **Full-stack TypeScript**: End-to-end type safety with shared schemas
- **Real-time Communication**: WebSocket implementation for live collaboration
- **Modern UI**: Responsive design with Tailwind CSS and Shadcn/UI components
- **Secure Authentication**: Session-based auth with role-based route protection

## Architecture Overview

### Frontend (React + TypeScript)
```
client/src/
├── components/     # Reusable UI components (modals, forms, etc.)
├── hooks/          # Custom React hooks (auth, toast, socket)
├── lib/            # Utility libraries (query client, socket, WebRTC)
├── pages/          # Main application pages
└── App.tsx         # Root component with routing
```

### Backend (Node.js + Express)
```
server/
├── services/      # External service integrations (OpenAI)
├── index.ts       # Application entry point
├── routes.ts      # REST API and WebSocket routes
├── storage.ts     # In-memory data storage layer
└── types.ts       # TypeScript type extensions
```

### Shared (Type Definitions)
```
shared/
└── schema.ts      # Database schemas and types (Drizzle ORM)
```

## Data Models

### User Management
- **Users**: Teachers and students with role-based permissions
- **Sessions**: Authentication and active session tracking

### Content Management
- **Notes**: Educational materials with file upload support
- **Annotations**: Highlights and notes on educational content
- **Messages**: Chat system with AI moderation

### Collaboration
- **Study Groups**: Student-created collaborative spaces
- **Group Members**: Membership tracking for study groups
- **Active Sessions**: Real-time presence and cursor tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Content Management
- `GET /api/notes` - List all notes
- `GET /api/notes/:id` - Get specific note
- `POST /api/notes` - Create new note (teachers only)
- `DELETE /api/notes/:id` - Delete note (teachers only)
- `POST /api/notes/upload` - Upload file-based notes

### User Management
- `GET /api/users/teachers` - List all teachers
- `GET /api/users/:id` - Get user profile

### Study Groups
- `GET /api/study-groups` - List study groups
- `POST /api/study-groups` - Create study group
- `POST /api/study-groups/:id/join` - Join study group
- `DELETE /api/study-groups/:id/leave` - Leave study group

### Real-time Features
- `GET /api/messages` - Get chat messages
- `POST /api/annotations` - Create annotations
- `GET /api/sessions` - Get active sessions

## Real-time Communication

### WebSocket Events
- **Authentication**: `auth`, `auth_success`, `auth_error`
- **Collaboration**: `join_room`, `cursor_move`, `cursor_update`
- **Annotations**: `highlight_create`, `highlight_added`
- **Chat**: `chat_message` with AI moderation

### AI Moderation
The platform uses OpenAI GPT-4o for real-time chat moderation:
- Filters inappropriate content
- Ensures educational focus
- Maintains respectful communication

## File Upload System

### Supported Formats
- **Documents**: PDF, PPT, PPTX, DOC, DOCX
- **Images**: JPG, JPEG, PNG, GIF
- **Size Limit**: 50MB per file

### File Processing
- Server-side validation and type checking
- Secure file storage in `uploads/` directory
- URL-based file serving for authenticated users

## Development Setup

### Prerequisites
- Node.js 18+ with npm
- TypeScript support
- OpenAI API key for moderation features

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
PORT=5000
```

### Installation & Running
```bash
npm install
npm run dev  # Starts both frontend and backend
```

### Project Structure Benefits
- **Type Safety**: Shared schemas ensure consistency
- **Real-time Features**: WebSocket integration for live collaboration
- **Modular Design**: Separate concerns with clear boundaries
- **Scalable Architecture**: Easy to extend with new features

## User Flows

### Teacher Workflow
1. Register/login with teacher role
2. Access teacher dashboard with upload capabilities
3. Upload educational materials (files or text)
4. Monitor student engagement and analytics
5. Participate in real-time collaboration

### Student Workflow
1. Register/login with student role
2. Browse teachers and their materials
3. Access read-only educational content
4. Participate in real-time collaboration (highlighting, chat)
5. Create and join study groups
6. Engage in moderated discussions

## Security Features

### Authentication & Authorization
- Session-based authentication with secure tokens
- Role-based access control (teacher/student)
- Protected routes with middleware validation

### Content Security
- File type validation and size limits
- AI-powered content moderation
- Secure file storage and serving

### Data Protection
- In-memory storage for development
- Type-safe data operations
- Input validation with Zod schemas

## Performance Optimizations

### Frontend
- React Query for efficient data fetching and caching
- Component-level code splitting
- Optimized re-renders with proper dependency arrays

### Backend
- Efficient WebSocket connection management
- Streaming file uploads with Multer
- Memory-optimized data structures

### Real-time Features
- Selective WebSocket broadcasting
- Cursor position throttling
- Annotation batching for better performance

## Future Enhancements

### Planned Features
- Database persistence (PostgreSQL integration ready)
- Advanced analytics and reporting
- Mobile-responsive improvements
- Offline mode support
- Integration with learning management systems

### Scalability Considerations
- Database migration from in-memory to PostgreSQL
- Redis for session management
- CDN integration for file serving
- Horizontal scaling with load balancing

## AI Integration Details

### OpenAI GPT-4o Integration
- Real-time message moderation
- Educational content assessment
- Automatic study group name generation
- Context-aware content filtering

### Moderation Features
- Inappropriate content detection
- Educational relevance scoring
- Automatic content flagging
- Teacher notification system

## Deployment Notes

### College Server Deployment
- Designed for internal college networks
- Easy configuration for institutional settings
- Support for custom domain integration
- SSL/TLS ready for production

### Environment Configuration
- Development and production modes
- Configurable file upload limits
- Adjustable AI moderation sensitivity
- Custom branding support

This documentation provides a comprehensive overview of the EduCollab platform, covering its architecture, features, and implementation details for developers and stakeholders.