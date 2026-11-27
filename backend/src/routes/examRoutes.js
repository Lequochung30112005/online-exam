const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createExam,
  getExams,
  deleteExam,
  getExamByRoomCode,
  getExamParticipants,
} = require('../controllers/examController');

// Middleware kiểm tra quyền Giảng viên (độc lập, không phụ thuộc tên export trong authMiddleware)
const requireTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    return next();
  }
  res.status(403);
  return next(new Error('Chỉ giảng viên mới có quyền thực hiện thao tác này'));
};

router.route('/')
  .get(protect, getExams)
  .post(protect, requireTeacher, createExam);

router.get('/room/:roomCode', protect, getExamByRoomCode);
router.get('/:id/participants', protect, requireTeacher, getExamParticipants);
router.delete('/:id', protect, requireTeacher, deleteExam);

module.exports = router;