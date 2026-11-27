const Exam = require('../models/Exam');
const Result = require('../models/Result');

// POST /api/exams (Giáo viên tạo đề thi)
const createExam = async (req, res, next) => {
  try {
    const { title, description, durationMinutes, questions, roomCode } = req.body;
    const examData = {
      title,
      description,
      durationMinutes,
      questions,
      createdBy: req.user._id
    };
    if (roomCode) examData.roomCode = roomCode.toUpperCase();

    const exam = await Exam.create(examData);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

// GET /api/exams (GV xem đề của mình, SV xem danh sách đề đang mở)
const getExams = async (req, res, next) => {
  try {
    const filter = req.user.role === 'teacher' 
      ? { createdBy: req.user._id } 
      : { isPublished: true };

    const exams = await Exam.find(filter)
      .select('-questions') // Không trả danh sách ID câu hỏi ở màn danh sách
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    // Đếm số lượng câu hỏi cho từng đề
    const rawExams = await Exam.find(filter).select('_id questions');
    const countMap = {};
    rawExams.forEach(e => { countMap[e._id.toString()] = e.questions.length; });

    const formatted = exams.map(exam => ({
      ...exam.toObject(),
      questionCount: countMap[exam._id.toString()] || 0
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

// GET /api/exams/room/:roomCode (Sinh viên tìm đề thi bằng mã phòng)
const getExamByRoomCode = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ 
      roomCode: req.params.roomCode.toUpperCase(),
      isPublished: true 
    }).populate('createdBy', 'fullName');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Mã phòng thi không tồn tại hoặc đã đóng' });
    }

    res.json({
      success: true,
      data: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        roomCode: exam.roomCode,
        durationMinutes: exam.durationMinutes,
        questionCount: exam.questions.length,
        teacherName: exam.createdBy?.fullName
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/exams/:id/participants (Giáo viên xem danh sách SV thi và bảng điểm)
const getExamParticipants = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
    }

    const results = await Result.find({ examId: req.params.id })
      .populate('studentId', 'fullName email studentCode')
      .sort({ score: -1, createdAt: 1 });

    const formattedResults = results.map(r => ({
      resultId: r._id,
      studentName: r.studentId?.fullName || 'Ẩn danh',
      studentCode: r.studentId?.studentCode || 'N/A',
      email: r.studentId?.email,
      score: r.score,
      correctCount: r.correctCount,
      totalQuestions: r.totalQuestions,
      submittedAt: r.createdAt
    }));

    res.json({
      success: true,
      examTitle: exam.title,
      roomCode: exam.roomCode,
      results: formattedResults
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createExam, getExams, getExamByRoomCode, getExamParticipants };