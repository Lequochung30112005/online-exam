/**
 * Engine chấm điểm tự động chuẩn hóa trên Server
 * Tránh mọi can thiệp điểm số từ phía Client
 */
const gradeExam = (questions, submittedAnswers = []) => {
  const answerMap = new Map();

  // Chuẩn hóa danh sách câu trả lời thành Map(questionId -> selectedOption)
  if (Array.isArray(submittedAnswers)) {
    submittedAnswers.forEach((item) => {
      if (item && item.questionId) {
        answerMap.set(item.questionId.toString(), String(item.selectedOption || '').trim());
      }
    });
  } else if (submittedAnswers && typeof submittedAnswers === 'object') {
    Object.entries(submittedAnswers).forEach(([qId, opt]) => {
      answerMap.set(qId.toString(), String(opt || '').trim());
    });
  }

  let correctCount = 0;
  let wrongCount = 0;
  const totalQuestions = questions.length;

  const gradedAnswers = questions.map((q) => {
    const qId = q._id.toString();
    const selectedOption = answerMap.get(qId) || '';
    const correctOption = String(q.correctOption || '').trim();
    const isCorrect = selectedOption !== '' && selectedOption === correctOption;

    if (isCorrect) {
      correctCount++;
    } else {
      wrongCount++;
    }

    return {
      questionId: q._id,
      selectedOption,
      isCorrect,
    };
  });

  // Tính điểm thang 10 làm tròn 2 chữ số thập phân
  const score =
    totalQuestions > 0
      ? Math.round(((correctCount / totalQuestions) * 10) * 100) / 100
      : 0;

  return {
    gradedAnswers,
    correctCount,
    wrongCount,
    totalQuestions,
    score,
  };
};

module.exports = { gradeExam };