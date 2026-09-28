import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  name: { type: String, require: true },
  code: { type: String, require: true, unique: true },
  teacher: { type: String },
  duration: { type: String },
  start: { type: String },
  end: { type: String },
  fee: { type: String },
  max: { type: Number },
  status: { type: String, default: 'Active' },
  schedule: { type: String },
  desc: { type: String }
});

export default mongoose.model('course', courseSchema);
