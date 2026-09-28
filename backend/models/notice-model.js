import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  cat: { type: String },
  date: { type: String },
  msg: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('notice', noticeSchema);
