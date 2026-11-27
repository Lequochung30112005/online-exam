const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, studentCode } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'student',
      studentCode: role === 'student' ? studentCode : null
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          studentCode: user.studentCode
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      studentCode: req.user.studentCode
    }
  });
};

module.exports = { register, login, getMe };