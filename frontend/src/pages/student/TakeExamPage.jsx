import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { examService } from '../../services/examService';
import { submissionQueue } from '../../utils/submissionQueue';
import ExamTimer from '../../components/student/ExamTimer';

export default function TakeExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [attemptMeta, setAttemptMeta] = useState({ attemptId: null, expiresAt: null, serverOffsetMs: 0 });
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [submitStatusMsg, setSubmitStatusMsg] = useState('');

  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    examService
      .startAttempt(examId)
      .then((res) => {
        const examData = res.data.data;
        const serverTime = Number(res.data.serverTime) || Date.now();
        const serverOffsetMs = serverTime - Date.now();
        const validExpiresAt = res.data.expiresAt
          ? new Date(res.data.expiresAt).toISOString()
          : new Date(serverTime + (examData.durationMinutes || 15) * 60 * 1000).toISOString();

        const savedDraft = localStorage.getItem(`draft_exam_${examId}`);
        setAnswers(savedDraft ? JSON.parse(savedDraft) : {});
        setAttemptMeta({
          attemptId: res.data.attemptId || examId,
          expiresAt: validExpiresAt,
          serverOffsetMs,
        });
        setExam(examData);
      })
      .catch((err) => {
        alert(err.response?.data?.message || 'Không thể vào phòng thi');
        navigate('/student/dashboard');
      });
  }, [examId, navigate]);

  const handleSelectOption = useCallback(
    (questionId, optionKey) => {
      if (isLocked) return;
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: optionKey };
        localStorage.setItem(`draft_exam_${examId}`, JSON.stringify(next));
        return next;
      });
    },
    [isLocked, examId]
  );

  const toggleFlagQuestion = (questionId) => {
    if (isLocked) return;
    setFlaggedQuestions((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const scrollToQuestion = (questionId) => {
    const el = document.getElementById(`q-box-${questionId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const triggerSubmission = useCallback(
    async (isAutoSubmit = false) => {
      if (!exam || isLocked) return;

      if (!isAutoSubmit) {
        const answeredCount = Object.keys(answersRef.current).length;
        const total = exam.questions.length;
        const unanswered = total - answeredCount;
        const confirmMsg =
          unanswered > 0
            ? `Bạn mới hoàn thành ${answeredCount}/${total} câu (còn ${unanswered} câu bỏ trống).\nBạn có chắc chắn muốn nộp bài ngay bây giờ không?`
            : `Bạn đã hoàn thành toàn bộ ${total}/${total} câu.\nXác nhận nộp bài thi?`;
        if (!window.confirm(confirmMsg)) return;
      }

      setIsLocked(true);
      setSubmitStatusMsg(
        isAutoSubmit
          ? '⏰ Hết giờ làm bài! Đã khóa đáp án và đưa vào hàng đợi nộp bài...'
          : '🔒 Đã khóa bài làm, đang gửi kết quả lên hệ thống...'
      );

      const result = await submissionQueue.enqueueSubmission({
        examId,
        attemptId: attemptMeta.attemptId,
        answers: answersRef.current,
        isAutoSubmit,
        onRetryStatus: (msg) => setSubmitStatusMsg(msg),
      });

      if (result) {
        navigate(`/student/result/${result.resultId}`, { state: { preloadedResult: result }, replace: true });
      }
    },
    [exam, examId, attemptMeta.attemptId, isLocked, navigate]
  );

  if (!exam) {
    return <div className="app-container">Đang tải đề thi và đồng bộ thời gian...</div>;
  }

  const answeredCount = Object.keys(answers).length;
  const totalCount = exam.questions.length;

  return (
    <div className="app-container">
      <header className="app-header sticky-exam">
        <div>
          <h2 className="header-title">{exam.title}</h2>
          <div className="header-subtitle">
            <span>Thí sinh: <b>{user?.fullName}</b></span>
            <span>•</span>
            <span>{isLocked ? '🔒 Đã khóa bài làm' : '💾 Tự động lưu nháp'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ExamTimer
            expiresAt={attemptMeta.expiresAt}
            serverOffsetMs={attemptMeta.serverOffsetMs}
            isLocked={isLocked}
            onExpire={() => triggerSubmission(true)}
          />
          <button disabled={isLocked} className="btn btn-success" onClick={() => triggerSubmission(false)}>
            {isLocked ? 'Đang nộp bài...' : 'Nộp bài ngay'}
          </button>
        </div>
      </header>

      {submitStatusMsg && <div className="status-banner">{submitStatusMsg}</div>}

      <div className="exam-workspace" style={{ opacity: isLocked ? 0.75 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
        <div>
          {exam.questions.map((q, idx) => (
            <div key={q._id} id={`q-box-${q._id}`} className="question-box">
              <div className="question-header">
                <b>Câu {idx + 1}: {q.content}</b>
                <button
                  type="button"
                  className={`flag-btn ${flaggedQuestions[q._id] ? 'flagged' : ''}`}
                  onClick={() => toggleFlagQuestion(q._id)}
                >
                  {flaggedQuestions[q._id] ? '🚩 Đang phân vân' : '🏳 Đánh dấu'}
                </button>
              </div>

              <div className="option-list">
                {q.options.map((opt) => (
                  <label key={opt.key} className={`option-label ${answers[q._id] === opt.key ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={q._id}
                      disabled={isLocked}
                      checked={answers[q._id] === opt.key}
                      onChange={() => handleSelectOption(q._id, opt.key)}
                      style={{ marginTop: 3 }}
                    />
                    <span><b>{opt.key}.</b> {opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="palette-card">
          <h4 style={{ margin: '0 0 6px 0' }}>Danh sách câu hỏi</h4>
          <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
            Đã làm: <b>{answeredCount} / {totalCount}</b> câu
          </p>

          <div className="palette-grid">
            {exam.questions.map((q, idx) => (
              <button
                key={q._id}
                type="button"
                onClick={() => scrollToQuestion(q._id)}
                className={`palette-btn ${answers[q._id] ? 'answered' : ''} ${flaggedQuestions[q._id] ? 'flagged' : ''}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="palette-legend">
            <span>🟦 Đã làm</span>
            <span>⬜ Chưa làm</span>
            <span>🟠 Đánh dấu</span>
          </div>

          <button
            disabled={isLocked}
            className="btn btn-success"
            style={{ width: '100%', padding: '12px' }}
            onClick={() => triggerSubmission(false)}
          >
            {isLocked ? 'Đang xử lý nộp bài...' : 'Hoàn thành & Nộp bài'}
          </button>
        </aside>
      </div>
    </div>
  );
}