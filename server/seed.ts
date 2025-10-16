import 'dotenv/config';
import { connectDB } from './db';
import { storage } from './storage';

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('Starting database seeding...');
    
    // Check if users already exist
    const existingUsers = await storage.getAllUsers();
    if (existingUsers.length > 0) {
      console.log('Database already has users, skipping seed...');
      process.exit(0);
    }
    
    // Create default users
    console.log('Creating default users...');
    
    const admin = await storage.createUser({
      username: 'admin',
      email: 'admin@university.edu',
      password: 'admin123',
      role: 'admin',
      fullName: 'System Administrator',
      department: 'IT Administration',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
    });
    
    const teacher = await storage.createUser({
      username: 'sarah.johnson',
      email: 'sarah.johnson@university.edu',
      password: 'teacher123',
      role: 'teacher',
      fullName: 'Dr. Sarah Johnson',
      department: 'Computer Science Department',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
    });
    
    const student = await storage.createUser({
      username: 'emily.chen',
      email: 'emily.chen@student.university.edu',
      password: 'student123',
      role: 'student',
      fullName: 'Emily Chen',
      department: 'Computer Science',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
    });
    
    console.log('Created users:', { admin: admin._id, teacher: teacher._id, student: student._id });
    
    // Create a sample study group
    console.log('Creating sample study group...');
    const studyGroup = await storage.createStudyGroup({
      name: 'Advanced Algorithms Study Group',
      description: 'A study group for students taking advanced algorithms course',
      creatorId: teacher._id,
      schedule: 'Mon, Wed 7PM',
    });
    
    // Add student to the study group
    await storage.joinStudyGroup(studyGroup._id, student._id);
    
    console.log('Created study group:', studyGroup._id);
    
    // Create a sample note
    console.log('Creating sample note...');
    const note = await storage.createNote({
      teacherId: teacher._id,
      groupId: studyGroup._id,
      title: 'Introduction to Graph Algorithms',
      description: 'Basic concepts and implementations of graph algorithms',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Introduction to Graph Algorithms' }]
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Graph algorithms are fundamental to computer science and are used in many applications...' }
            ]
          }
        ]
      },
      category: 'lecture',
    });
    
    console.log('Created note:', note._id);
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();


