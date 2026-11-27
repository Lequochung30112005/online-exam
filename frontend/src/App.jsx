import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/common/MainLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import TakeExamPage from './pages/student/TakeExamPage';
import ResultDetailPage from './pages/student/ResultDetailPage';
import QuestionBankPage from './pages/teacher/QuestionBankPage';
import CreateExamPage from './pages/teacher/CreateExamPage';
import ExamResultsPage from './pages/teacher/ExamResultsPage';

import './styles/examPlatform.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Phòng làm bài thi toàn màn hình */}
          <Route
            path="/student/exam/:examId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <TakeExamPage />
              </ProtectedRoute>
            }
          />

          {/* Khu vực có thanh điều hướng chung */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/result/:resultId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ResultDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teacher/questions"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <QuestionBankPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/exams"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <CreateExamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/results"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <ExamResultsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}