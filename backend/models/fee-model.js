import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'student', required: true },
  studentName: { type: String },
  course: { type: String },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  method: { type: String },
  status: { type: String, default: 'Paid' },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('fee', feeSchema);
