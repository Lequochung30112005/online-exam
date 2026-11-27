const Question = require('../models/Question');

// GET /api/questions
const getQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

// POST /api/questions
const createQuestion = async (req, res, next) => {
  try {
    const { content, options, correctOption, subject } = req.body;
    const question = await Question.create({
      content,
      options,
      correctOption,
      subject,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

// PUT /api/questions/:id
const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
    }
    if (question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa câu hỏi này' });
    }

    const updated = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/questions/:id
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
    }
    if (question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa câu hỏi này' });
    }

    await question.deleteOne();
    res.json({ success: true, message: 'Đã xóa câu hỏi' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuestions, createQuestion, updateQuestion, deleteQuestion };