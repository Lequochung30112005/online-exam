const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const examRoutes = require('./routes/examRoutes');

const Exam = require('./models/Exam');
const Result = require('./models/Result');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json());

// Đảm bảo kết nối DB trước mọi request (quan trọng khi deploy Vercel)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Route kiểm tra server
app.get('/', (req, res) => {
  res.json({ message: 'Online Exam Platform API is running...' });
});

// Các cụm API chính của TV1
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);

// 1. Bắt đầu làm bài thi (Trả về câu hỏi đã ẩn đáp án đúng)
app.get('/api/attempts/start/:examId', protect, async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.examId).populate(
      'questions',
      '-correctOption'
    );
    if (!exam) {
      res.status(404);
      throw new Error('Không tìm thấy đề thi');
    }
    res.json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
});

// 2. Nộp bài thi, chấm điểm tự động và lưu vào MongoDB
app.post('/api/attempts/submit/:examId', protect, async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.examId).populate('questions');
    if (!exam) {
      res.status(404);
      throw new Error('Không tìm thấy đề thi');
    }

    const { answers } = req.body;
    let correctCount = 0;
    const detailedAnswers = [];

    exam.questions.forEach((q) => {
      const selected = answers ? answers[q._id.toString()] : null;
      const isCorrect = selected === q.correctOption;
      if (isCorrect) correctCount++;

      detailedAnswers.push({
        questionId: q._id,
        selectedOption: selected || '',
        isCorrect,
      });
    });

    const total = exam.questions.length;
    const wrongCount = total - correctCount;
    const score = total > 0 ? Number(((correctCount / total) * 10).toFixed(2)) : 0;

    // Lưu đúng cấu trúc schema Result có sẵn của dự án
    const savedResult = await Result.create({
      attemptId: new mongoose.Types.ObjectId(),
      examId: exam._id,
      studentId: req.user._id,
      answers: detailedAnswers,
      correctCount,
      wrongCount,
      totalQuestions: total,
      score,
    });

    res.status(201).json({
      success: true,
      result: {
        resultId: savedResult._id,
        examTitle: exam.title,
        correctCount,
        wrongCount,
        totalQuestions: total,
        score,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 3. Lấy lịch sử làm bài của Sinh viên đang đăng nhập
app.get('/api/results/my-history', protect, async (req, res, next) => {
  try {
    const history = await Result.find({ studentId: req.user._id })
      .populate('examId', 'title roomCode durationMinutes')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;