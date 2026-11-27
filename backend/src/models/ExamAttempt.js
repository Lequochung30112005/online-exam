const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    submittedAt: { type: Date },
    status: { type: String, enum: ['in-progress', 'submitted'], default: 'in-progress' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);