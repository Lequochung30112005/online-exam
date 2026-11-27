import React, { useState, useEffect } from 'react';

const StartExamButton = React.memo(function StartExamButton({ startTime, serverOffsetMs, onStart }) {
  const [msRemaining, setMsRemaining] = useState(() => {
    if (!startTime) return 0;
    return Math.max(0, new Date(startTime).getTime() - (Date.now() + serverOffsetMs));
  });

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, new Date(startTime).getTime() - (Date.now() + serverOffsetMs));
      setMsRemaining(diff);
      if (diff === 0) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, [startTime, serverOffsetMs]);

  const isNotYetOpen = msRemaining > 0;

  const formatCountdown = (ms) => {
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h} giờ ${m} phút ${s} giây`;
    return `${m} phút ${s < 10 ? '0' : ''}${s} giây`;
  };

  const vnFormattedTime = startTime
    ? new Date(startTime).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  return (
    <div style={{ marginTop: 12 }}>
      {startTime && (
        <p style={{ margin: '0 0 12px 0', fontSize: 14, color: isNotYetOpen ? '#b45309' : '#15803d' }}>
          🕒 Thời gian mở đề (Giờ VN): <b>{vnFormattedTime}</b>
        </p>
      )}
      <button
        disabled={isNotYetOpen}
        onClick={onStart}
        className={`btn ${isNotYetOpen ? 'btn-secondary' : 'btn-success'}`}
        style={{ padding: '12px 24px', fontSize: 15 }}
      >
        {isNotYetOpen
          ? `⏳ Chưa đến giờ thi (Mở sau: ${formatCountdown(msRemaining)})`
          : '🚀 Bắt đầu làm bài ngay'}
      </button>
    </div>
  );
});

export default StartExamButton;