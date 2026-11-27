const express = require('express');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { logUniqueClientError } = require('./services/logService');

const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const examRoutes = require('./routes/examRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const resultRoutes = require('./routes/resultRoutes');

const app = express();

app.use(compression());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Online Exam Platform API is running...',
    serverTime: Date.now(),
  });
});

app.post('/api/logs/client-error', (req, res) => {
  const { examId, errorCode, message } = req.body;
  const result = logUniqueClientError({
    studentId: req.user?._id?.toString() || 'client-user',
    examId,
    errorCode,
    message,
  });
  res.status(200).json({ success: true, ...result });
});

// Kiểm tra tự động xem file route nào chưa export đúng router
const routeMap = [
  ['/api/auth', authRoutes, 'authRoutes.js'],
  ['/api/questions', questionRoutes, 'questionRoutes.js'],
  ['/api/exams', examRoutes, 'examRoutes.js'],
  ['/api/attempts', attemptRoutes, 'attemptRoutes.js'],
  ['/api/results', resultRoutes, 'resultRoutes.js'],
];

routeMap.forEach(([path, handler, fileName]) => {
  if (typeof handler !== 'function') {
    throw new Error(`❌ File backend/src/routes/${fileName} đang bị rỗng hoặc thiếu "module.exports = router;"`);
  }
  app.use(path, handler);
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;