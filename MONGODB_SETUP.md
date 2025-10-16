# StudyStream MongoDB Setup Guide

## Database Migration Complete! 🎉

Your StudyStream application has been successfully migrated from PostgreSQL to MongoDB. Here's what you need to do to get it running:

## Prerequisites

### 1. Install Node.js
- Download and install Node.js from https://nodejs.org/
- Choose the LTS (Long Term Support) version
- This will also install npm (Node Package Manager)

### 2. Install MongoDB
You have two options:

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster (free tier available)
4. Get your connection string

#### Option B: Local MongoDB Installation
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install MongoDB locally
3. Start MongoDB service

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with the following content:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/studystream
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studystream

# Server Configuration
PORT=5000
NODE_ENV=development

# OpenAI Configuration (optional)
OPENAI_API_KEY=your_openai_api_key_here

# Session Secret (for express-session)
SESSION_SECRET=your_session_secret_here
```

### 3. Seed the Database (Optional)
To populate the database with sample data:
```bash
npm run db:seed
```

### 4. Start the Application
```bash
npm run dev
```

The application will be available at http://localhost:5000

## What Changed

### Database Schema
- Converted from PostgreSQL tables to MongoDB collections
- Updated all data models to use Mongoose schemas
- Maintained the same API interface for compatibility

### Dependencies Updated
- Removed: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-zod`, `drizzle-kit`
- Added: `mongodb`, `mongoose`

### Files Modified
- `package.json` - Updated dependencies and scripts
- `shared/schema.ts` - Converted to Mongoose schemas
- `server/db.ts` - MongoDB connection setup
- `server/storage.ts` - Updated all database operations
- `server/index.ts` - Added MongoDB connection
- `server/seed.ts` - New database seeding script

### Files Removed
- `drizzle.config.ts` - No longer needed

## Default Users Created

The seed script creates these default users:

1. **Admin User**
   - Username: `admin`
   - Email: `admin@university.edu`
   - Password: `admin123`
   - Role: Admin

2. **Teacher User**
   - Username: `sarah.johnson`
   - Email: `sarah.johnson@university.edu`
   - Password: `teacher123`
   - Role: Teacher

3. **Student User**
   - Username: `emily.chen`
   - Email: `emily.chen@student.university.edu`
   - Password: `student123`
   - Role: Student

## Features Preserved

All original features are maintained:
- User management (admin, teacher, student roles)
- Study groups
- Notes and file uploads
- Real-time collaborative editing
- Messaging system
- Annotations
- Notifications
- Content moderation
- Session management

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running (if using local installation)
- Check your connection string in `.env`
- Verify network access (if using MongoDB Atlas)

### Port Already in Use
- Change the PORT in your `.env` file
- Or stop the process using port 5000

### Missing Dependencies
- Run `npm install` again
- Clear node_modules and reinstall if needed

## Next Steps

1. Install Node.js and MongoDB
2. Run `npm install`
3. Create your `.env` file
4. Run `npm run db:seed` (optional)
5. Run `npm run dev`
6. Open http://localhost:5000

Your StudyStream application is now ready to run with MongoDB! 🚀


