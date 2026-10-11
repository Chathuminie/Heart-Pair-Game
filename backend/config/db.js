const mongoose = require('mongoose');
module.exports = async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heartpairdb', { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
};
