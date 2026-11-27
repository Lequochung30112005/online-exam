import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('student1@demo.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'teacher' ? '/teacher/questions' : '/student/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Đăng nhập Hệ thống Thi</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>
          GV: <b>teacher@demo.com</b> / <b>Password123!</b><br />
          SV: <b>student1@demo.com</b> / <b>Password123!</b>
        </p>
        <form onSubmit={handleSubmit} className="form-stack">
          <input className="form-control" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="form-control" type="password" placeholder="Mật khẩu" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
        <div style={{ marginTop: 14 }}>
          <Link to="/register" className="btn-link">Chưa có tài khoản? Đăng ký mới</Link>
        </div>
      </div>
    </div>
  );
}