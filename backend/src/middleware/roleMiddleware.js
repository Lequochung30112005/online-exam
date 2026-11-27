const isTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Truy cập bị từ chối: Chỉ dành cho Giáo viên' });
};

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Truy cập bị từ chối: Chỉ dành cho Sinh viên' });
};

module.exports = { isTeacher, isStudent };