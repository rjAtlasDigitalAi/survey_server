import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Attempt connection with a short 2-second timeout
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.isMockDB = false;
  } catch (error) {
    console.log(`\n⚠️  MongoDB Connection Failed: ${error.message}`);
    console.log('⚠️  Falling back to Mock DB Mode (writing to mock_db_responses.json) for testing.');
    console.log('⚠️  If you want to use MongoDB, make sure the service is running.\n');
    global.isMockDB = true;
  }
};

export default connectDB;
