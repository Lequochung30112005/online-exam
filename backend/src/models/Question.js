const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  content: { type: String, required: [true, 'Nội dung câu hỏi không được để trống'] },
  options: [
    {
      key: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
      text: { type: String, required: true }
    }
  ],
  correctOption: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  subject: { type: String, default: 'Lập trình Web' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);