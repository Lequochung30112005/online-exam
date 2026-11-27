require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Khởi tạo Socket.io cho tính năng Realtime Bảng điểm & Giám sát phòng thi
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  // Giáo viên hoặc thí sinh tham gia phòng theo dõi đề thi
  socket.on('exam:join_room', (examId) => {
    if (examId) socket.join(`exam_${examId}`);
  });

  socket.on('exam:leave_room', (examId) => {
    if (examId) socket.leave(`exam_${examId}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server & Realtime Socket running on http://localhost:${PORT}`);
});