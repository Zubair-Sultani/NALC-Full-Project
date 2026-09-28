import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'teacher', required: true },
  teacherName: { type: String },
  month: { type: String, required: true },
  amount: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  deduct: { type: Number, default: 0 },
  net: { type: Number },
  status: { type: String, default: 'Paid' },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('salary', salarySchema);
