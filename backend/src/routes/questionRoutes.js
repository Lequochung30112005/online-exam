const express = require('express');
const router = express.Router();
const { getQuestions, createQuestion, updateQuestion, deleteQuestion } = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');
const { isTeacher } = require('../middleware/roleMiddleware');

// Toàn bộ API câu hỏi chỉ dành cho Giáo viên
router.use(protect, isTeacher);

router.route('/').get(getQuestions).post(createQuestion);
router.route('/:id').put(updateQuestion).delete(deleteQuestion);

module.exports = router;