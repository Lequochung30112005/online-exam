import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../../services/examService';
import StartExamButton from '../../components/student/StartExamButton';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('001');
  const [foundExam, setFoundExam] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    examService
      .getMyHistory()
      .then((res) => setHistory(res.data.data))
      .catch(console.error);
  }, []);

  const handleSearchRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await examService.getExamByRoom(searchCode);
      const serverOffsetMs = res.data.serverTime ? res.data.serverTime - Date.now() : 0;
      setFoundExam({ ...res.data.data, serverOffsetMs });
    } catch (err) {
      setFoundExam(null);
      alert(err.response?.data?.message || 'Không tìm thấy phòng thi');
    }
  };

  return (
    <div className="dashboard-grid">
      {/* Cột trái: Tra cứu & Vào phòng thi */}
      <div className="surface-card">
        <h3>Tra cứu & Vào Phòng Thi</h3>
        <form onSubmit={handleSearchRoom} style={{ display: 'flex', gap: 10 }}>
          <input
            className="form-control"
            placeholder="Nhập mã phòng (VD: 001)"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            Tìm phòng
          </button>
        </form>

        {foundExam && (
          <div className="item-card" style={{ marginTop: 18, background: '#f0fdf4', borderColor: '#86efac' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#166534', fontSize: 17 }}>{foundExam.title}</h4>
            <p style={{ margin: '4px 0', fontSize: 14 }}>{foundExam.description}</p>
            <p style={{ margin: '4px 0', fontSize: 14 }}>
              Giáo viên: <b>{foundExam.teacherName}</b> | Thời gian: <b>{foundExam.durationMinutes} phút</b> | Số câu: <b>{foundExam.questionCount}</b>
            </p>
            <StartExamButton
              startTime={foundExam.startTime}
              serverOffsetMs={foundExam.serverOffsetMs || 0}
              onStart={() => navigate(`/student/exam/${foundExam._id}`)}
            />
          </div>
        )}
      </div>

      {/* Cột phải: Lịch sử làm bài & Xem lại chi tiết */}
      <div className="surface-card">
        <h3>Lịch sử bài thi đã nộp ({history.length})</h3>
        {history.length === 0 ? (
          <p style={{ color: '#64748b' }}>Bạn chưa hoàn thành bài thi nào.</p>
        ) : (
          history.map((h) => (
            <div key={h._id} className="item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <b style={{ fontSize: 15 }}>{h.examId?.title || 'Đề thi'} (Mã: {h.examId?.roomCode || 'N/A'})</b>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Đúng <b>{h.correctCount}/{h.totalQuestions}</b> câu • Nộp lúc:{' '}
                    {new Date(h.createdAt || h.submittedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 16 }}>
                    {h.score} / 10
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/student/result/${h._id}`)}
                  >
                    🔍 Xem lại bài làm
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}