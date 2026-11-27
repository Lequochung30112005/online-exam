import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { examService } from '../../services/examService';

export default function ResultDetailPage() {
  const { resultId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [result, setResult] = useState(location.state?.preloadedResult || null);
  const [loading, setLoading] = useState(!location.state?.preloadedResult);

  useEffect(() => {
    if (result) return;
    examService
      .getResultDetail(resultId)
      .then((res) => setResult(res.data.result))
      .catch((err) => {
        alert(err.response?.data?.message || 'Không tìm thấy chi tiết bài làm');
        navigate('/student/dashboard');
      })
      .finally(() => setLoading(false));
  }, [resultId, result, navigate]);

  if (loading || !result) {
    return <div className="surface-card">Đang tải chi tiết bài làm...</div>;
  }

  return (
    <div className="surface-card">
      <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ color: '#1d4ed8', margin: 0 }}>🎉 Kết quả bài thi: {result.examTitle}</h3>
        <p style={{ fontSize: 30, fontWeight: 800, margin: '10px 0', color: '#16a34a' }}>
          {result.score} / 10 điểm
        </p>
        <p style={{ fontSize: 15, margin: '0 0 14px 0' }}>
          Số câu đúng: <b>{result.correctCount} / {result.totalQuestions}</b> câu
        </p>
        <button className="btn btn-secondary" onClick={() => navigate('/student/dashboard')}>
          ← Quay về Phòng thi & Lịch sử
        </button>
      </div>

      <div className="review-container">
        <h4 style={{ marginTop: 0, color: '#1e3a8a', fontSize: 16 }}>📋 Chi tiết bài làm & Đáp án chuẩn</h4>
        {result.review?.map((item, idx) => (
          <div key={item.questionId} className={`review-question ${item.isCorrect ? 'correct' : 'wrong'}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <b>Câu {idx + 1}: {item.content}</b>
              <span style={{ color: item.isCorrect ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                {item.isCorrect ? '✓ Đúng' : item.selectedOption ? '✗ Sai' : '✗ Bỏ trống'}
              </span>
            </div>

            <div className="option-list">
              {item.options.map((opt) => {
                const isCorrectOpt = opt.key === item.correctOption;
                const isSelectedWrong = opt.key === item.selectedOption && !item.isCorrect;

                let cls = 'review-option';
                if (isCorrectOpt) cls += ' is-correct';
                else if (isSelectedWrong) cls += ' is-wrong';

                return (
                  <div key={opt.key} className={cls}>
                    <b>{opt.key}.</b> {opt.text}
                    {isCorrectOpt && <span> (Đáp án đúng)</span>}
                    {isSelectedWrong && <span> (Bạn đã chọn)</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button className="btn btn-success" style={{ padding: '12px 24px' }} onClick={() => navigate('/student/dashboard')}>
            ✓ Đã xem xong & Quay về trang chính
          </button>
        </div>
      </div>
    </div>
  );
}