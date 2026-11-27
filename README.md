# 🎓 Online Exam Platform (MERN Stack + Realtime Socket.io)

Hệ thống thi trắc nghiệm trực tuyến chuẩn hóa quy trình học vụ (múi giờ `Asia/Ho_Chi_Minh` - UTC+7), tích hợp chấm điểm tự động phía Server, cập nhật kết quả thời gian thực (Realtime) và cơ chế hàng đợi chống mất bài khi rớt mạng.

---

## 🚀 Tính năng cốt lõi đã hoàn thiện

* **Phân quyền & Xác thực (JWT & RBAC):** Hỗ trợ 2 vai trò chính là **Giảng viên (`teacher`)** và **Sinh viên (`student`)** với middleware bảo vệ route chặt chẽ.
* **Quản lý Ngân hàng câu hỏi & Đề thi:** Tạo câu hỏi, thiết lập đề thi, thời gian làm bài và khung giờ mở/đóng đề chuẩn UTC+7.
* **Phòng thi thời gian thực & Đồng hồ đồng bộ Server:** Tính toán thời gian còn lại dựa trên mốc thời gian của Server, hạn chế gian lận chỉnh giờ máy trạm.
* **Cơ chế chống mất bài (`submissionQueue`):** Tự động lưu nháp và đưa bài nộp vào hàng đợi `localStorage` kèm cơ chế tự động thử lại (Auto-retry) khi mất kết nối mạng hoặc Server gặp sự cố tạm thời.
* **Engine chấm điểm phía Server (`gradingService`):** Toàn bộ đáp án được đối chiếu và tính điểm (thang 10) độc lập trên Backend, ngăn chặn can thiệp dữ liệu từ Client.
* **Theo dõi Realtime & Xem chi tiết bài làm:** Giảng viên theo dõi tiến độ/điểm số lớp học trực tiếp qua Socket.io; sinh viên xem lại lịch sử thi và chi tiết đúng/sai từng câu.
* **CI/CD Pipeline:** Tự động kiểm tra cú pháp Backend và build kiểm thử Frontend qua GitHub Actions trên mỗi lần push/PR vào `main` và `develop`.

---

## 🛠️ Công nghệ sử dụng

| Tầng hệ thống | Công nghệ |
| :--- | :--- |
| **Frontend** | React (Vite), React Router, Context API, Axios, Socket.io Client |
| **Backend** | Node.js, Express.js, Socket.io, Compression (Gzip) |
| **Database** | MongoDB Atlas & Mongoose ODM |
| **DevOps / CI** | GitHub Actions, Git Flow (`main` / `develop`) |

---

## 📂 Cấu trúc thư mục dự án

```text
online-exam-platform/
├── .github/workflows/
│   └── ci.yml                 # Pipeline kiểm thử tự động Backend & Frontend
├── backend/
│   ├── server.js              # Entry point khởi tạo HTTP Server & Socket.io
│   └── src/
│       ├── app.js             # Cấu hình Express, CORS, Gzip, Routes & Error Handling
│       ├── config/            # Kết nối MongoDB
│       ├── controllers/       # Xử lý nghiệp vụ (Auth, Exam, Attempt, Result, Question)
│       ├── middleware/        # Xác thực JWT & xử lý lỗi tập trung
│       ├── models/            # Mongoose Schemas (User, Question, Exam, ExamAttempt, Result)
│       ├── routes/            # Định tuyến RESTful API
│       └── services/          # gradingService (chấm điểm) & logService (ghi nhận lỗi Client)
└── frontend/
    └── src/
        ├── components/        # ExamTimer, StartExamButton, MainLayout...
        ├── contexts/          # AuthContext quản lý phiên đăng nhập
        ├── pages/             # Giao diện Auth, Student (Dashboard, TakeExam, ResultDetail), Teacher
        ├── routes/            # ProtectedRoute phân quyền giao diện
        ├── services/          # Tầng gọi API (Axios)
        └── utils/             # submissionQueue.js (hàng đợi nộp bài tự động retry)
