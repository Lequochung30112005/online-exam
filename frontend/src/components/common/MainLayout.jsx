import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h2 className="header-title">Online Exam Platform</h2>
          <div className="header-subtitle">
            <span>Xin chào: <b>{user?.fullName}</b></span>
            <span className="role-badge">{user?.role?.toUpperCase()}</span>
          </div>
        </div>
        <button className="btn btn-danger" onClick={handleLogout}>
          Đăng xuất
        </button>
      </header>

      <nav className="nav-tabs">
        {user?.role === 'teacher' ? (
          <>
            <NavLink to="/teacher/questions" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
              1. Ngân hàng Câu hỏi
            </NavLink>
            <NavLink to="/teacher/exams" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
              2. Tạo & Quản lý Đề thi
            </NavLink>
            <NavLink to="/teacher/results" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
              3. Bảng điểm lớp (Realtime)
            </NavLink>
          </>
        ) : (
          <NavLink to="/student/dashboard" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
            Phòng Thi & Lịch Sử Làm Bài
          </NavLink>
        )}
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}