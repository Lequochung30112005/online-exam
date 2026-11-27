import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { examService } from '../../services/examService';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export default function ExamResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(searchParams.get('examId') || '');
  const [participantsData, setParticipantsData] = useState(null);

  useEffect(() => {
    examService.getExams().then((res) => {
      const list = res.data.data;
      setExams(list);
      if (!selectedExamId && list.length > 0) {
        setSelectedExamId(list[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    setSearchParams({ examId: selectedExamId });

    examService
      .getParticipants(selectedExamId)
      .then((res) => setParticipantsData({ ...res.data, examId: selectedExamId }))
      .catch(console.error);

    const socket = io(SOCKET_URL);
    socket.emit('exam:join_room', selectedExamId);

    socket.on('exam:new_submission', (newSub) => {
      setParticipantsData((prev) => {
        if (!prev || prev.examId !== newSub.examId) return prev;
        const exists = prev.results.some((r) => r.resultId === newSub.resultId);
        if (exists) return prev;
        return { ...prev, results: [newSub, ...prev.results] };
      });
    });

    return () => {
      socket.emit('exam:leave_room', selectedExamId);
      socket.disconnect();
    };
  }, [selectedExamId]);

  return (
    <div className="surface-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Bảng điểm trực tiếp</h3>
          <span className="live-badge">● LIVE REALTIME</span>
        </div>

        <select
          className="form-control"
          style={{ maxWidth: 320 }}
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
        >
          {exams.map((ex) => (
            <option key={ex._id} value={ex._id}>
              {ex.title} (Mã phòng: {ex.roomCode})
            </option>
          ))}
        </select>
      </div>

      {participantsData && (
        <>
          {participantsData.results.length === 0 ? (
            <p style={{ color: '#64748b' }}>Chưa có sinh viên nào nộp bài cho đề thi này.</p>
          ) : (
            participantsData.results.map((r, idx) => (
              <div key={r.resultId} className="item-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b>#{idx + 1} • {r.studentName}</b> ({r.studentCode})
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Nộp lúc: {new Date(r.submittedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 16 }}>{r.score} / 10 điểm</span>
                  <div style={{ fontSize: 12, color: '#475569' }}>Đúng {r.correctCount}/{r.totalQuestions} câu</div>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}