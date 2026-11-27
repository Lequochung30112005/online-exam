import api from './api';

export const questionService = {
  getQuestions: () => api.get('/questions'),
  createQuestion: (data) => api.post('/questions', data),
  updateQuestion: (id, data) => api.put(`/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
};

export default questionService;