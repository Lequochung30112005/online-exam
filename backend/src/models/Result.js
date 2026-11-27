const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamAttempt', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalQuestions: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  wrongCount: { type: Number, required: true },
  score: { type: Number, required: true },
  details: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      selectedOption: { type: String, default: null },
      correctOption: { type: String, required: true },
      isCorrect: { type: Boolean, required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);