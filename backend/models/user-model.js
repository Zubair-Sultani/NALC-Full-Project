import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Administrator','Teacher','Student'], default: 'Student' },
  name: { type: String }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
