const express = require('express');
const router = express.Router();
const { createExam, getExams, getExamByRoomCode, getExamParticipants } = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');
const { isTeacher } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getExams)
  .post(isTeacher, createExam);

router.get('/room/:roomCode', getExamByRoomCode);
router.get('/:id/participants', isTeacher, getExamParticipants);

module.exports = router;