import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  kind: { type: String, enum: ['student', 'teacher'], required: true },
  records: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model('Attendance', attendanceSchema);
