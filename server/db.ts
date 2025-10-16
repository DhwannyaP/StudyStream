import 'dotenv/config';
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required to initialize the database client");
}

// Connect to MongoDB
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Export mongoose for use in other files
export { mongoose };