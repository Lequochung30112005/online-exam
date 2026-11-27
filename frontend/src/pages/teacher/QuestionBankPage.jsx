import React, { useState, useEffect } from 'react';
import { questionService } from '../../services/questionService';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState([]);
  const [qForm, setQForm] = useState({
    content: '',
    optA: '',
    optB: '',
    optC: '',
    optD: '',
    correctOption: 'A',
    subject: 'Lập trình Web',
  });

  const loadQuestions = () => {
    questionService.getQuestions().then((res) => setQuestions(res.data.data)).catch(console.error);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await questionService.createQuestion({
        content: qForm.content,
        options: [
          { key: 'A', text: qForm.optA },
          { key: 'B', text: qForm.optB },
          { key: 'C', text: qForm.optC },
          { key: 'D', text: qForm.optD },
        ],
        correctOption: qForm.correctOption,
        subject: qForm.subject,
      });
      setQForm({ content: '', optA: '', optB: '', optC: '', optD: '', correctOption: 'A', subject: 'Lập trình Web' });
      loadQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi lưu câu hỏi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa câu hỏi này?')) return;
    const backup = [...questions];
    setQuestions((prev) => prev.filter((q) => q._id !== id));
    try {
      await questionService.deleteQuestion(id);
    } catch (err) {
      setQuestions(backup);
      alert(err.response?.data?.message || 'Lỗi xóa câu hỏi');
    }
  };

  return (
    <div className="dashboard-grid">
      <div className="surface-card">
        <h3>Thêm câu hỏi mới</h3>
        <form onSubmit={handleSave} className="form-stack">
          <input className="form-control" placeholder="Môn học" required value={qForm.subject} onChange={(e) => setQForm({ ...qForm, subject: e.target.value })} />
          <textarea className="form-control" style={{ minHeight: 75 }} placeholder="Nội dung câu hỏi..." required value={qForm.content} onChange={(e) => setQForm({ ...qForm, content: e.target.value })} />
          <input className="form-control" placeholder="Đáp án A" required value={qForm.optA} onChange={(e) => setQForm({ ...qForm, optA: e.target.value })} />
          <input className="form-control" placeholder="Đáp án B" required value={qForm.optB} onChange={(e) => setQForm({ ...qForm, optB: e.target.value })} />
          <input className="form-control" placeholder="Đáp án C" required value={qForm.optC} onChange={(e) => setQForm({ ...qForm, optC: e.target.value })} />
          <input className="form-control" placeholder="Đáp án D" required value={qForm.optD} onChange={(e) => setQForm({ ...qForm, optD: e.target.value })} />
          <select className="form-control" value={qForm.correctOption} onChange={(e) => setQForm({ ...qForm, correctOption: e.target.value })}>
            <option value="A">Đáp án đúng: A</option>
            <option value="B">Đáp án đúng: B</option>
            <option value="C">Đáp án đúng: C</option>
            <option value="D">Đáp án đúng: D</option>
          </select>
          <button className="btn btn-primary" type="submit">Lưu câu hỏi</button>
        </form>
      </div>

      <div className="surface-card">
        <h3>Ngân hàng câu hỏi ({questions.length})</h3>
        {questions.map((q, index) => (
          <div key={q._id} className="item-card">
            <b>Câu {index + 1}: {q.content}</b>
            <ul style={{ margin: '8px 0', paddingLeft: 20, fontSize: 14 }}>
              {q.options.map((o) => (
                <li key={o.key} style={{ color: o.key === q.correctOption ? '#16a34a' : '#334155', fontWeight: o.key === q.correctOption ? 700 : 400 }}>
                  {o.key}. {o.text} {o.key === q.correctOption && '✓'}
                </li>
              ))}
            </ul>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q._id)}>Xóa</button>
          </div>
        ))}
      </div>
    </div>
  );
}