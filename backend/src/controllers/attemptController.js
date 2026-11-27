const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Result = require('../models/Result');
const { gradeExam } = require('../services/gradingService');

// Hàm trộn mảng ngẫu nhiên (Fisher-Yates Shuffle)
const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// @desc    Bắt đầu hoặc khôi phục lượt làm bài thi (Kiểm tra lịch VN, giới hạn lượt thi & trộn đề)
// @route   GET /api/attempts/start/:examId
const startExam = async (req, res, next) => {
  try {
    const [exam, existingAttempt, completedCount] = await Promise.all([
      Exam.findById(req.params.examId)
        .populate('questions', '-correctOption')
        .lean(),
      ExamAttempt.findOne({
        examId: req.params.examId,
        studentId: req.user._id,
        status: 'in-progress',
      }).lean(),
      Result.countDocuments({
        examId: req.params.examId,
        studentId: req.user._id,
      }),
    ]);

    if (!exam) {
      res.status(404);
      throw new Error('Không tìm thấy đề thi');
    }

    const now = Date.now();

    // 1. Kiểm tra giờ mở đề (Giờ VN)
    if (exam.startTime && now < new Date(exam.startTime).getTime()) {
      const vnTimeStr = new Date(exam.startTime).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
      });
      res.status(403);
      throw new Error(`Chưa đến giờ làm bài! Phòng thi sẽ mở lúc ${vnTimeStr} (Giờ VN)`);
    }

    // 2. Kiểm tra hạn chót đóng phòng thi
    if (exam.endTime && now > new Date(exam.endTime).getTime()) {
      res.status(403);
      throw new Error('Phòng thi này đã hết hạn và đóng lại!');
    }

    // 3. Kiểm tra giới hạn số lần làm bài (maxAttempts)
    const maxAllowed = exam.maxAttempts || 1;
    if (completedCount >= maxAllowed && !existingAttempt) {
      res.status(403);
      throw new Error(`Bạn đã sử dụng hết ${maxAllowed}/${maxAllowed} lượt làm bài cho đề thi này!`);
    }

    let attempt = existingAttempt;

    if (!attempt || !attempt.expiresAt || new Date(attempt.expiresAt).getTime() <= now) {
      let expiresAt = new Date(now + exam.durationMinutes * 60 * 1000);
      // Nếu có endTime của phòng thi và sớm hơn thời lượng làm bài -> khóa theo endTime
      if (exam.endTime && new Date(exam.endTime).getTime() < expiresAt.getTime()) {
        expiresAt = new Date(exam.endTime);
      }

      attempt = await ExamAttempt.create({
        examId: exam._id,
        studentId: req.user._id,
        startedAt: new Date(now),
        expiresAt,
      });
    }

    // 4. Trộn thứ tự câu hỏi & đáp án nếu giảng viên bật quy chế trộn đề
    let processedQuestions = exam.questions || [];
    if (exam.shuffleQuestions) {
      processedQuestions = shuffleArray(processedQuestions);
    }
    if (exam.shuffleOptions) {
      processedQuestions = processedQuestions.map((q) => ({
        ...q,
        options: shuffleArray(q.options || []),
      }));
    }

    res.json({
      success: true,
      serverTime: now,
      expiresAt: attempt.expiresAt,
      attemptId: attempt._id,
      data: {
        ...exam,
        questions: processedQuestions,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Nộp bài thi an toàn (Idempotent + Tôn trọng cấu hình showResultReview)
// @route   POST /api/attempts/submit/:examId
const submitExam = async (req, res, next) => {
  try {
    const { answers, attemptId } = req.body;

    if (attemptId) {
      const existingResult = await Result.findOne({
        attemptId,
        studentId: req.user._id,
      }).lean();

      if (existingResult) {
        const examForReview = await Exam.findById(req.params.examId)
          .populate('questions')
          .lean();

        const canReview = examForReview?.showResultReview !== false;
        const review = canReview
          ? (examForReview?.questions || []).map((q) => {
              const ansObj = existingResult.answers.find(
                (a) => a.questionId.toString() === q._id.toString()
              );
              const selectedOption = ansObj ? ansObj.selectedOption : '';
              return {
                questionId: q._id,
                content: q.content,
                options: q.options,
                selectedOption,
                correctOption: q.correctOption,
                isCorrect: selectedOption === q.correctOption,
              };
            })
          : null;

        return res.status(200).json({
          success: true,
          idempotent: true,
          result: {
            resultId: existingResult._id,
            examTitle: examForReview?.title || 'Đề thi',
            correctCount: existingResult.correctCount,
            wrongCount: existingResult.wrongCount,
            totalQuestions: existingResult.totalQuestions,
            score: existingResult.score,
            review,
          },
        });
      }
    }

    const [exam, attempt] = await Promise.all([
      Exam.findById(req.params.examId).populate('questions').lean(),
      ExamAttempt.findOneAndUpdate(
        {
          examId: req.params.examId,
          studentId: req.user._id,
          status: 'in-progress',
        },
        { status: 'submitted', submittedAt: new Date() },
        { new: true, sort: { createdAt: -1 } }
      ),
    ]);

    if (!exam) {
      res.status(404);
      throw new Error('Không tìm thấy đề thi');
    }

    const { detailedAnswers, correctCount, wrongCount, totalQuestions, score } =
      gradeExam(exam.questions, answers);

    const savedResult = await Result.create({
      attemptId: attempt ? attempt._id : attemptId || exam._id,
      examId: exam._id,
      studentId: req.user._id,
      answers: detailedAnswers,
      correctCount,
      wrongCount,
      totalQuestions,
      score,
    });

    const canReview = exam.showResultReview !== false;
    const review = canReview
      ? exam.questions.map((q) => {
          const selectedOption = answers ? answers[q._id.toString()] || '' : '';
          return {
            questionId: q._id,
            content: q.content,
            options: q.options,
            selectedOption,
            correctOption: q.correctOption,
            isCorrect: selectedOption === q.correctOption,
          };
        })
      : null;

    const io = req.app.get('io');
    if (io) {
      io.to(`exam_${exam._id}`).emit('exam:new_submission', {
        resultId: savedResult._id,
        examId: exam._id,
        studentName: req.user.fullName,
        studentCode: req.user.studentCode || 'N/A',
        score,
        correctCount,
        totalQuestions,
        submittedAt: savedResult.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      result: {
        resultId: savedResult._id,
        examTitle: exam.title,
        correctCount,
        wrongCount,
        totalQuestions,
        score,
        review,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { startExam, submitExam };