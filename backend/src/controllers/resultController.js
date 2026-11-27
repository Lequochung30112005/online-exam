const Result = require('../models/Result');
const Exam = require('../models/Exam');

// @desc    Lấy danh sách lịch sử các bài thi đã nộp của sinh viên
// @route   GET /api/results/my-history
const getMyHistory = async (req, res, next) => {
  try {
    const results = await Result.find({ studentId: req.user._id })
      .populate('examId', 'title roomCode durationMinutes')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Xem lại chi tiết bài làm theo resultId
// @route   GET /api/results/:id
const getResultDetail = async (req, res, next) => {
  try {
    const result = await Result.findOne({
      _id: req.params.id,
      studentId: req.user._id,
    }).lean();

    if (!result) {
      res.status(404);
      throw new Error('Không tìm thấy dữ liệu bài làm này');
    }

    const exam = await Exam.findById(result.examId).populate('questions').lean();

    if (!exam) {
      res.status(404);
      throw new Error('Đề thi của bài làm này không còn tồn tại');
    }

    const review = exam.questions.map((q) => {
      const ansRecord = (result.answers || []).find(
        (a) => a.questionId.toString() === q._id.toString()
      );
      const selectedOption = ansRecord ? ansRecord.selectedOption : '';
      return {
        questionId: q._id,
        content: q.content,
        options: q.options,
        selectedOption,
        correctOption: q.correctOption,
        isCorrect: selectedOption === q.correctOption,
      };
    });

    res.json({
      success: true,
      result: {
        resultId: result._id,
        examTitle: exam.title,
        roomCode: exam.roomCode,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        totalQuestions: result.totalQuestions,
        score: result.score,
        submittedAt: result.createdAt,
        review,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyHistory, getResultDetail };