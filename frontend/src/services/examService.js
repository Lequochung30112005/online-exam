import api from './api';

export const examService = {
  getExams: () => api.get('/exams'),
  createExam: (data) => api.post('/exams', data),
  deleteExam: (examId) => api.delete(`/exams/${examId}`),
  getExamByRoom: (roomCode) => api.get(`/exams/room/${roomCode}`),
  getParticipants: (examId) => api.get(`/exams/${examId}/participants`),
  startAttempt: (examId) => api.get(`/attempts/start/${examId}`),
  submitAttempt: (examId, payload) => api.post(`/attempts/submit/${examId}`, payload),
  getMyHistory: () => api.get('/results/my-history'),
  getResultDetail: (resultId) => api.get(`/results/${resultId}`),
};

export default examService;