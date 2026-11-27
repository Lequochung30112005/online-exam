const Exam = require('../models/Exam');
const Result = require('../models/Result');

const parseVNDateTime = (dtStr) => {
  if (!dtStr) return null;
  const hasTimezone = /([+-]\d{2}:\d{2}|Z)$/.test(dtStr);
  return new Date(hasTimezone ? dtStr : `${dtStr}+07:00`);
};

// @desc    Giáo viên tạo đề thi chuẩn quốc tế (Lịch VN + Quy chế trộn đề & giới hạn lượt thi)
// @route   POST /api/exams
const createExam = async (req, res, next) => {
  try {
    const {
      title,
      description,
      durationMinutes,
      questions,
      roomCode,
      startTime,
      endTime,
      maxAttempts,
      shuffleQuestions,
      shuffleOptions,
      showResultReview,
    } = req.body;

    const parsedStartTime = parseVNDateTime(startTime) || new Date();
    const parsedEndTime = parseVNDateTime(endTime);

    if (parsedEndTime && parsedEndTime <= parsedStartTime) {
      res.status(400);
      throw new Error('Thời gian đóng phòng thi phải sau thời gian bắt đầu!');
    }

    const examData = {
      title,
      description,
      durationMinutes,
      questions,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      maxAttempts: Number(maxAttempts) || 1,
      shuffleQuestions: Boolean(shuffleQuestions),
      shuffleOptions: Boolean(shuffleOptions),
      showResultReview: showResultReview !== undefined ? Boolean(showResultReview) : true,
      createdBy: req.user._id,
    };

    if (roomCode) examData.roomCode = roomCode.trim().toUpperCase();

    const exam = await Exam.create(examData);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách đề thi
// @route   GET /api/exams
const getExams = async (req, res, next) => {
  try {
    const filter = req.user.role === 'teacher' ? { createdBy: req.user._id } : {};
    const exams = await Exam.find(filter)
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = exams.map((ex) => ({
      ...ex,
      questionCount: ex.questions ? ex.questions.length : 0,
    }));

    res.json({ success: true, serverTime: Date.now(), data: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa đề thi (Chỉ giảng viên tạo đề mới được xóa)
// @route   DELETE /api/exams/:id
const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!exam) {
      res.status(404);
      throw new Error('Không tìm thấy đề thi hoặc bạn không có quyền xóa');
    }

    res.json({ success: true, message: 'Đã xóa đề thi thành công' });
  } catch (error) {
    next(error);
  }
};

// @desc    Tra cứu phòng thi theo mã phòng
// @route   GET /api/exams/room/:roomCode
const getExamByRoomCode = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({
      roomCode: req.params.roomCode.trim().toUpperCase(),
    })
      .populate('createdBy', 'fullName')
      .lean();

    if (!exam) {
      res.status(404);
      throw new Error('Không tìm thấy phòng thi với mã này');
    }

    res.json({
      success: true,
      serverTime: Date.now(),
      data: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        roomCode: exam.roomCode,
        startTime: exam.startTime || exam.createdAt,
        endTime: exam.endTime || null,
        maxAttempts: exam.maxAttempts || 1,
        shuffleQuestions: exam.shuffleQuestions,
        shuffleOptions: exam.shuffleOptions,
        questionCount: exam.questions ? exam.questions.length : 0,
        teacherName: exam.createdBy?.fullName || 'Giảng viên',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Giáo viên xem bảng điểm của lớp theo đề thi
// @route   GET /api/exams/:id/participants
const getExamParticipants = async (req, res, next) => {
  try {
    const [exam, results] = await Promise.all([
      Exam.findById(req.params.id).lean(),
      Result.find({ examId: req.params.id })
        .populate('studentId', 'fullName studentCode email')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!exam) {
      res.status(404);
      throw new Error('Không tìm thấy đề thi');
    }

    const formattedResults = results.map((r) => ({
      resultId: r._id,
      studentName: r.studentId?.fullName || 'Sinh viên',
      studentCode: r.studentId?.studentCode || 'N/A',
      score: r.score,
      correctCount: r.correctCount,
      totalQuestions: r.totalQuestions,
      submittedAt: r.createdAt,
    }));

    res.json({
      success: true,
      examTitle: exam.title,
      results: formattedResults,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  getExams,
  deleteExam,
  getExamByRoomCode,
  getExamParticipants,
};