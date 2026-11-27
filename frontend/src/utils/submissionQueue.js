import api from '../services/api';

class SubmissionQueueManager {
  constructor() {
    this.isProcessing = false;
    this.reportedKeys = new Set();
  }

  // Gửi log lỗi lên server 1 lần duy nhất
  async reportErrorOnce(examId, errorCode, message) {
    const key = `${examId}:${errorCode}`;
    if (this.reportedKeys.has(key)) return;
    this.reportedKeys.add(key);

    try {
      await api.post('/logs/client-error', { examId, errorCode, message });
    } catch {
      // Bỏ qua nếu server đang hoàn toàn mất kết nối để tránh vòng lặp vô hạn
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Đưa bài làm vào hàng đợi nộp bài:
   * - isAutoSubmit = true: Thêm Jitter ngẫu nhiên (0-1500ms) giãn tải khi hết giờ
   * - Tự động retry sau mỗi 5000ms nếu lỗi
   */
  async enqueueSubmission({ examId, attemptId, answers, isAutoSubmit, onRetryStatus }) {
    if (this.isProcessing) return null;
    this.isProcessing = true;

    try {
      // Giãn tải hàng đợi khi hàng loạt thí sinh hết giờ cùng lúc
      if (isAutoSubmit) {
        const jitterMs = Math.floor(Math.random() * 1500);
        await this.sleep(jitterMs);
      }

      let attemptCount = 0;
      while (true) {
        attemptCount++;
        try {
          const res = await api.post(`/attempts/submit/${examId}`, {
            answers,
            attemptId,
          });
          // Xóa bản nháp localStorage sau khi nộp thành công
          localStorage.removeItem(`draft_exam_${examId}`);
          return res.data.result;
        } catch (err) {
          const status = err.response?.status || 'NETWORK_ERROR';
          const errMsg = err.response?.data?.message || err.message || 'Lỗi kết nối';

          // Báo lỗi lên server 1 lần duy nhất
          await this.reportErrorOnce(examId, String(status), errMsg);

          if (onRetryStatus) {
            onRetryStatus(
              `Kết nối gián đoạn (Lần ${attemptCount}). Đã khóa đáp án, tự động nộp lại sau 5 giây...`
            );
          }

          // Đợi đúng 5 giây trước khi nộp lại
          await this.sleep(5000);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

export const submissionQueue = new SubmissionQueueManager();