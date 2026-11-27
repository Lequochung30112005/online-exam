import React, { useState, useEffect, useRef } from 'react';

const ExamTimer = React.memo(function ExamTimer({ expiresAt, serverOffsetMs, isLocked, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const now = Date.now() + serverOffsetMs;
    const target = new Date(expiresAt).getTime();
    if (Number.isNaN(target)) return 900;
    return Math.max(0, Math.ceil((target - now) / 1000));
  });

  const expiredTriggered = useRef(false);

  useEffect(() => {
    if (isLocked) return;

    const tick = () => {
      const serverNow = Date.now() + serverOffsetMs;
      const target = new Date(expiresAt).getTime();
      if (Number.isNaN(target)) return;

      const diffSec = Math.max(0, Math.ceil((target - serverNow) / 1000));
      setSecondsLeft(diffSec);

      if (diffSec === 0 && !expiredTriggered.current) {
        expiredTriggered.current = true;
        onExpire();
      }
    };

    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [expiresAt, serverOffsetMs, isLocked, onExpire]);

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;

  return (
    <div className={`exam-timer ${secondsLeft <= 30 ? 'urgent' : ''}`}>
      ⏱ {m}:{s < 10 ? '0' : ''}{s}
    </div>
  );
});

export default ExamTimer;