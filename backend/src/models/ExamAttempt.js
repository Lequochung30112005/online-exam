const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  submittedAt: { type: Date, default: null },
  status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      selectedOption: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);