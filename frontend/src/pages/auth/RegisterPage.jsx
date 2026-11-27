import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    studentCode: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Đăng ký Tài khoản</h2>
        <form onSubmit={handleSubmit} className="form-stack">
          <input className="form-control" placeholder="Họ và tên" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="student">Sinh viên (Student)</option>
            <option value="teacher">Giáo viên (Teacher)</option>
          </select>
          {form.role === 'student' && (
            <input className="form-control" placeholder="Mã sinh viên" value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} />
          )}
          <input className="form-control" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="form-control" type="password" placeholder="Mật khẩu" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>
        <div style={{ marginTop: 14 }}>
          <Link to="/login" className="btn-link">Đã có tài khoản? Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}