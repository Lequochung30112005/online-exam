const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: false,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedOption: { type: String, default: '' },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    correctCount: { type: Number, required: true, default: 0 },
    wrongCount: { type: Number, required: true, default: 0 },
    totalQuestions: { type: Number, required: true, default: 0 },
    score: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Result', resultSchema);