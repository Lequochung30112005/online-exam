const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Tên đề thi không được để trống'], trim: true },
  description: { type: String, default: '' },
  roomCode: { 
    type: String, 
    unique: true, 
    uppercase: true, 
    trim: true,
    default: () => Math.random().toString(36).substring(2, 8).toUpperCase() // Tự sinh mã 6 ký tự VD: A8X92K
  },
  durationMinutes: { type: Number, required: true, min: 1 },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  isPublished: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);