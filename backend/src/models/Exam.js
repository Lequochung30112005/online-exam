const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tên đề thi'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Vui lòng nhập thời gian làm bài'],
      min: 1,
    },
    roomCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    // Lịch thi chuẩn giờ Việt Nam (UTC+7)
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null, // null = không giới hạn hạn chót vào phòng
    },
    // Quy chế thi chuẩn quốc tế
    maxAttempts: {
      type: Number,
      default: 1, // Mặc định mỗi sinh viên chỉ được thi 1 lần
      min: 1,
    },
    shuffleQuestions: {
      type: Boolean,
      default: true,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    showResultReview: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

examSchema.pre('save', function (next) {
  if (!this.roomCode) {
    this.roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Exam', examSchema);