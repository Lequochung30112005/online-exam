import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionService } from '../../services/questionService';
import { examService } from '../../services/examService';

export default function CreateExamPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedQIds, setSelectedQIds] = useState([]);

  // Bộ lọc & Sinh đề ngẫu nhiên
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [randomCount, setRandomCount] = useState(5);

  // Form cấu hình đề thi chuẩn quốc tế
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    durationMinutes: 15,
    roomCode: '',
    startTime: '',
    endTime: '',
    maxAttempts: 1,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResultReview: true,
  });

  const loadData = () => {
    Promise.all([questionService.getQuestions(), examService.getExams()])
      .then(([qRes, eRes]) => {
        setQuestions(qRes.data.data);
        setExams(eRes.data.data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const subjects = useMemo(() => {
    const set = new Set(questions.map((q) => q.subject || 'Khác'));
    return ['ALL', ...Array.from(set)];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSub = subjectFilter === 'ALL' || (q.subject || 'Khác') === subjectFilter;
      const matchKey = q.content.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchSub && matchKey;
    });
  }, [questions, subjectFilter, searchKeyword]);

  const handlePickRandom = () => {
    if (filteredQuestions.length === 0) return alert('Không có câu hỏi nào trong bộ lọc!');
    const count = Math.min(Math.max(1, Number(randomCount)), filteredQuestions.length);
    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    const pickedIds = shuffled.slice(0, count).map((q) => q._id);
    setSelectedQIds(pickedIds);
  };

  const handleToggleSelectAll = () => {
    const filteredIds = filteredQuestions.map((q) => q._id);
    const allSelected = filteredIds.every((id) => selectedQIds.includes(id));
    if (allSelected) {
      setSelectedQIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedQIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (selectedQIds.length === 0) return alert('Vui lòng chọn ít nhất 1 câu hỏi cho đề thi!');

    try {
      await examService.createExam({
        ...examForm,
        startTime: examForm.startTime ? `${examForm.startTime}:00+07:00` : new Date().toISOString(),
        endTime: examForm.endTime ? `${examForm.endTime}:00+07:00` : null,
        questions: selectedQIds,
      });
      alert('🎉 Tạo đề thi chuẩn quốc tế thành công!');
      setExamForm({
        title: '',
        description: '',
        durationMinutes: 15,
        roomCode: '',
        startTime: '',
        endTime: '',
        maxAttempts: 1,
        shuffleQuestions: true,
        shuffleOptions: true,
        showResultReview: true,
      });
      setSelectedQIds([]);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo đề thi');
    }
  };

  const handleDeleteExam = async (examId, title) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa đề thi "${title}"?`)) return;
    try {
      await examService.deleteExam(examId);
      setExams((prev) => prev.filter((ex) => ex._id !== examId));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa đề thi');
    }
  };

  return (
    <div className="dashboard-grid">
      {/* CỘT TRÁI: FORM TẠO ĐỀ THI CHUẨN QUỐC TẾ */}
      <div className="surface-card">
        <h3>📝 Thiết lập Đề Thi Mới</h3>
        <form onSubmit={handleCreateExam} className="form-stack">
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <b style={{ fontSize: 13, color: '#1e3a8a', display: 'block', marginBottom: 10 }}>
              1. THÔNG TIN CƠ BẢN
            </b>
            <div className="form-stack">
              <input
                className="form-control"
                placeholder="Tên kỳ thi / đề thi (VD: Kiểm tra giữa kỳ Lập trình Web) *"
                required
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              />
              <textarea
                className="form-control"
                style={{ minHeight: 60 }}
                placeholder="Hướng dẫn làm bài / Mô tả ngắn cho thí sinh..."
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Thời lượng làm bài (phút) *</label>
                  <input
                    className="form-control"
                    type="number"
                    min="1"
                    required
                    value={examForm.durationMinutes}
                    onChange={(e) => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label">Mã phòng thi (Tùy chọn)</label>
                  <input
                    className="form-control"
                    placeholder="Bỏ trống để tự sinh mã"
                    value={examForm.roomCode}
                    onChange={(e) => setExamForm({ ...examForm, roomCode: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <b style={{ fontSize: 13, color: '#1e3a8a', display: 'block', marginBottom: 10 }}>
              2. LỊCH TỔ CHỨC THI (GIỜ VIỆT NAM UTC+7)
            </b>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="form-label">Giờ mở phòng (Trống = mở ngay)</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  value={examForm.startTime}
                  onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Hạn chót đóng phòng (Tùy chọn)</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  value={examForm.endTime}
                  onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <b style={{ fontSize: 13, color: '#1e3a8a', display: 'block', marginBottom: 10 }}>
              3. QUY CHẾ KHẢO THÍ & CHỐNG GIAN LẬN
            </b>
            <div style={{ marginBottom: 10 }}>
              <label className="form-label">Số lượt thi tối đa cho mỗi sinh viên</label>
              <select
                className="form-control"
                value={examForm.maxAttempts}
                onChange={(e) => setExamForm({ ...examForm, maxAttempts: Number(e.target.value) })}
              >
                <option value={1}>1 lần duy nhất (Thi chính thức)</option>
                <option value={2}>Tối đa 2 lần</option>
                <option value={3}>Tối đa 3 lần</option>
                <option value={99}>Không giới hạn (Luyện tập / Thi thử)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={examForm.shuffleQuestions}
                  onChange={(e) => setExamForm({ ...examForm, shuffleQuestions: e.target.checked })}
                />
                <span>🔀 Đảo ngẫu nhiên thứ tự câu hỏi cho từng thí sinh</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={examForm.shuffleOptions}
                  onChange={(e) => setExamForm({ ...examForm, shuffleOptions: e.target.checked })}
                />
                <span>🎲 Đảo ngẫu nhiên thứ tự đáp án (A, B, C, D)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={examForm.showResultReview}
                  onChange={(e) => setExamForm({ ...examForm, showResultReview: e.target.checked })}
                />
                <span>🔍 Cho phép thí sinh xem lại đáp án đúng/sai ngay sau khi nộp</span>
              </label>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <b style={{ fontSize: 13, color: '#1e3a8a' }}>
                4. CẤU TRÚC CÂU HỎI (ĐÃ CHỌN: {selectedQIds.length} CÂU)
              </b>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleToggleSelectAll}>
                Chọn / Bỏ chọn tất cả
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 8, marginBottom: 8 }}>
              <select
                className="form-control"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub === 'ALL' ? 'Tất cả môn học' : `Môn: ${sub}`}
                  </option>
                ))}
              </select>
              <input
                className="form-control"
                placeholder="Tìm nội dung câu hỏi..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <input
                className="form-control"
                type="number"
                min="1"
                max={filteredQuestions.length || 100}
                style={{ width: 85 }}
                value={randomCount}
                onChange={(e) => setRandomCount(e.target.value)}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={handlePickRandom}>
                🎲 Lấy ngẫu nhiên {randomCount} câu
              </button>
            </div>

            <div style={{ maxHeight: 220, overflowY: 'auto', background: '#fff', border: '1px solid #cbd5e1', padding: 10, borderRadius: 6 }}>
              {filteredQuestions.length === 0 ? (
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Không tìm thấy câu hỏi phù hợp.</p>
              ) : (
                filteredQuestions.map((q, idx) => (
                  <label key={q._id} style={{ display: 'block', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedQIds.includes(q._id)}
                      onChange={() =>
                        setSelectedQIds((prev) =>
                          prev.includes(q._id) ? prev.filter((i) => i !== q._id) : [...prev, q._id]
                        )
                      }
                    />{' '}
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>[{q.subject || 'Chung'}]</span>{' '}
                    Câu {idx + 1}: {q.content}
                  </label>
                ))
              )}
            </div>
          </div>

          <button className="btn btn-primary" type="submit" style={{ padding: '12px', fontSize: 15 }}>
            ✓ Xuất bản Đề thi
          </button>
        </form>
      </div>

      {/* CỘT PHẢI: DANH SÁCH ĐỀ THI ĐÃ XUẤT BẢN */}
      <div className="surface-card">
        <h3>📚 Danh sách Đề thi ({exams.length})</h3>
        {exams.length === 0 ? (
          <p style={{ color: '#64748b' }}>Chưa có đề thi nào được tạo.</p>
        ) : (
          exams.map((ex) => (
            <div key={ex._id} className="item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <b style={{ fontSize: 15 }}>{ex.title}</b>
                <span className="room-badge">Mã: {ex.roomCode}</span>
              </div>

              <div style={{ fontSize: 13, color: '#475569', margin: '8px 0', lineHeight: 1.6 }}>
                <div>
                  ⏱ Thời lượng: <b>{ex.durationMinutes} phút</b> • Số câu: <b>{ex.questionCount}</b> • Tối đa: <b>{ex.maxAttempts || 1} lượt</b>
                </div>
                <div>
                  {ex.shuffleQuestions && <span style={{ marginRight: 8 }}>🔀 Trộn câu</span>}
                  {ex.shuffleOptions && <span style={{ marginRight: 8 }}>🎲 Đảo đáp án</span>}
                  <span>{ex.showResultReview !== false ? '🔍 Xem đáp án' : '🔒 Khóa đáp án'}</span>
                </div>
                {ex.startTime && (
                  <div>
                    🟢 Mở đề (VN):{' '}
                    <b>
                      {new Date(ex.startTime).toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </b>
                  </div>
                )}
                {ex.endTime && (
                  <div>
                    🔴 Đóng phòng (VN):{' '}
                    <b>
                      {new Date(ex.endTime).toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </b>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/teacher/results?examId=${ex._id}`)}
                >
                  📊 Xem bảng điểm (Realtime)
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteExam(ex._id, ex.title)}
                >
                  Xóa đề
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}