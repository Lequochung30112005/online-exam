import { useState, useEffect } from 'react';
import api from './services/api';

export default function App() {
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState('questions');

    // Auth
    const [isRegister, setIsRegister] = useState(false);
    const [authForm, setAuthForm] = useState({
        fullName: '',
        email: 'student1@demo.com',
        password: 'Password123!',
        role: 'student',
        studentCode: '',
    });

    // Teacher States
    const [questions, setQuestions] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [qForm, setQForm] = useState({
        content: '',
        optA: '',
        optB: '',
        optC: '',
        optD: '',
        correctOption: 'A',
        subject: 'Lập trình Web',
    });
    const [exams, setExams] = useState([]);
    const [selectedQIds, setSelectedQIds] = useState([]);
    const [examForm, setExamForm] = useState({
        title: '',
        description: '',
        durationMinutes: 15,
        roomCode: '',
    });
    const [participantsData, setParticipantsData] = useState(null);

    // Student & Room States
    const [searchCode, setSearchCode] = useState('001');
    const [foundExam, setFoundExam] = useState(null);
    const [activeExam, setActiveExam] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [examResult, setExamResult] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api
                .get('/auth/me')
                .then((res) => setUser(res.data.user))
                .catch(() => localStorage.removeItem('token'));
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchExams();
            fetchHistory();
            if (user.role === 'teacher') {
                fetchQuestions();
                setTab('questions');
            } else {
                setTab('roomTest');
            }
        }
    }, [user]);

    useEffect(() => {
        if (!activeExam || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [activeExam, timeLeft]);

    const fetchQuestions = async () => {
        try {
            const res = await api.get('/questions');
            setQuestions(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchExams = async () => {
        try {
            const res = await api.get('/exams');
            setExams(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/results/my-history');
            setHistory(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        try {
            if (isRegister) {
                await api.post('/auth/register', authForm);
                alert('Đăng ký thành công! Hãy đăng nhập.');
                setIsRegister(false);
            } else {
                const res = await api.post('/auth/login', {
                    email: authForm.email,
                    password: authForm.password,
                });
                localStorage.setItem('token', res.data.token);
                setUser(res.data.user);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi xác thực');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setActiveExam(null);
        setExamResult(null);
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        const payload = {
            content: qForm.content,
            options: [
                { key: 'A', text: qForm.optA },
                { key: 'B', text: qForm.optB },
                { key: 'C', text: qForm.optC },
                { key: 'D', text: qForm.optD },
            ],
            correctOption: qForm.correctOption,
            subject: qForm.subject,
        };
        try {
            if (editingId) {
                await api.put(`/questions/${editingId}`, payload);
                setEditingId(null);
            } else {
                await api.post('/questions', payload);
            }
            setQForm({
                content: '',
                optA: '',
                optB: '',
                optC: '',
                optD: '',
                correctOption: 'A',
                subject: 'Lập trình Web',
            });
            fetchQuestions();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi lưu câu hỏi');
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm('Xóa câu hỏi này?')) return;
        try {
            await api.delete(`/questions/${id}`);
            fetchQuestions();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi xóa câu hỏi');
        }
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        if (selectedQIds.length === 0) return alert('Vui lòng chọn ít nhất 1 câu hỏi!');
        try {
            await api.post('/exams', { ...examForm, questions: selectedQIds });
            alert('Tạo đề thi thành công!');
            setExamForm({ title: '', description: '', durationMinutes: 15, roomCode: '' });
            setSelectedQIds([]);
            fetchExams();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi tạo đề thi');
        }
    };

    const handleViewParticipants = async (examId) => {
        try {
            const res = await api.get(`/exams/${examId}/participants`);
            setParticipantsData(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi tải bảng điểm');
        }
    };

    const handleSearchRoom = async () => {
        try {
            setExamResult(null);
            const res = await api.get(`/exams/room/${searchCode}`);
            setFoundExam(res.data.data);
        } catch (err) {
            setFoundExam(null);
            alert(err.response?.data?.message || 'Không tìm thấy phòng thi');
        }
    };

    const handleStartExam = async (examId) => {
        try {
            const res = await api.get(`/attempts/start/${examId}`);
            setActiveExam(res.data.data);
            setAnswers({});
            setExamResult(null);
            setTimeLeft(res.data.data.durationMinutes * 60);
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể vào phòng thi');
        }
    };

    const handleSubmitExam = async () => {
        if (!activeExam) return;
        try {
            const res = await api.post(`/attempts/submit/${activeExam._id}`, { answers });
            setExamResult(res.data.result);
            setActiveExam(null);
            fetchHistory();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi nộp bài');
        }
    };

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!user) {
        return (
            <div style={styles.authContainer}>
                <div style={styles.card}>
                    <h2 style={{ marginTop: 0 }}>{isRegister ? 'Đăng ký tài khoản' : 'Hệ thống Thi Trắc nghiệm'}</h2>
                    <p style={{ fontSize: 13, color: '#64748b' }}>
                        GV: <b>teacher@demo.com</b> / <b>Password123!</b><br />
                        SV: <b>student1@demo.com</b> / <b>Password123!</b>
                    </p>
                    <form onSubmit={handleAuth} style={styles.form}>
                        {isRegister && (
                            <>
                                <input style={styles.input} placeholder="Họ và tên" required value={authForm.fullName} onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })} />
                                <select style={styles.input} value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                                    <option value="student">Sinh viên (Student)</option>
                                    <option value="teacher">Giáo viên (Teacher)</option>
                                </select>
                                {authForm.role === 'student' && (
                                    <input style={styles.input} placeholder="Mã sinh viên" value={authForm.studentCode} onChange={(e) => setAuthForm({ ...authForm, studentCode: e.target.value })} />
                                )}
                            </>
                        )}
                        <input style={styles.input} type="email" placeholder="Email" required value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
                        <input style={styles.input} type="password" placeholder="Mật khẩu" required value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
                        <button style={styles.btnPrimary} type="submit">{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
                    </form>
                    <button style={styles.btnLink} onClick={() => setIsRegister(!isRegister)}>
                        {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký mới'}
                    </button>
                </div>
            </div>
        );
    }

    if (activeExam) {
        return (
            <div style={styles.container}>
                <div style={{ ...styles.header, position: 'sticky', top: 10, zIndex: 10 }}>
                    <div>
                        <h2 style={{ margin: 0 }}>{activeExam.title}</h2>
                        <span style={{ fontSize: 13, color: '#cbd5e1' }}>Thí sinh: {user.fullName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: '#dc2626', padding: '8px 16px', borderRadius: 8, fontWeight: 'bold', fontSize: 18 }}>
                            ⏱ {formatTime(timeLeft)}
                        </div>
                        <button style={{ ...styles.btnPrimary, background: '#16a34a' }} onClick={handleSubmitExam}>
                            Nộp bài ngay
                        </button>
                    </div>
                </div>

                <div style={styles.card}>
                    {activeExam.questions.map((q, idx) => (
                        <div key={q._id} style={styles.itemBox}>
                            <p style={{ fontWeight: 'bold', marginTop: 0 }}>Câu {idx + 1}: {q.content}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {q.options.map((opt) => (
                                    <label
                                        key={opt.key}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            border: answers[q._id] === opt.key ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                            background: answers[q._id] === opt.key ? '#eff6ff' : '#fff',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name={q._id}
                                            checked={answers[q._id] === opt.key}
                                            onChange={() => setAnswers({ ...answers, [q._id]: opt.key })}
                                        />{' '}
                                        <b>{opt.key}.</b> {opt.text}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button style={{ ...styles.btnPrimary, background: '#16a34a', width: '100%', padding: 14, fontSize: 16 }} onClick={handleSubmitExam}>
                        Hoàn thành & Nộp bài
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h2 style={{ margin: 0 }}>Online Exam Platform</h2>
                    <span style={{ fontSize: 13, color: '#cbd5e1' }}>
                        Xin chào: <b>{user.fullName}</b> | Vai trò: <span style={styles.badge}>{user.role.toUpperCase()}</span>
                    </span>
                </div>
                <button style={styles.btnDanger} onClick={handleLogout}>Đăng xuất</button>
            </header>

            <div style={styles.nav}>
                {user.role === 'teacher' && (
                    <>
                        <button style={tab === 'questions' ? styles.tabActive : styles.tab} onClick={() => setTab('questions')}>
                            1. Ngân hàng Câu hỏi ({questions.length})
                        </button>
                        <button style={tab === 'exams' ? styles.tabActive : styles.tab} onClick={() => setTab('exams')}>
                            2. Quản lý Đề thi ({exams.length})
                        </button>
                    </>
                )}
                <button style={tab === 'roomTest' ? styles.tabActive : styles.tab} onClick={() => setTab('roomTest')}>
                    Vào Phòng Thi
                </button>
                <button style={tab === 'history' ? styles.tabActive : styles.tab} onClick={() => setTab('history')}>
                    Lịch sử làm bài ({history.length})
                </button>
            </div>

            {tab === 'questions' && user.role === 'teacher' && (
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <h3>{editingId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
                        <form onSubmit={handleSaveQuestion} style={styles.form}>
                            <input style={styles.input} placeholder="Môn học" required value={qForm.subject} onChange={(e) => setQForm({ ...qForm, subject: e.target.value })} />
                            <textarea style={{ ...styles.input, minHeight: 70 }} placeholder="Nội dung câu hỏi..." required value={qForm.content} onChange={(e) => setQForm({ ...qForm, content: e.target.value })} />
                            <input style={styles.input} placeholder="Đáp án A" required value={qForm.optA} onChange={(e) => setQForm({ ...qForm, optA: e.target.value })} />
                            <input style={styles.input} placeholder="Đáp án B" required value={qForm.optB} onChange={(e) => setQForm({ ...qForm, optB: e.target.value })} />
                            <input style={styles.input} placeholder="Đáp án C" required value={qForm.optC} onChange={(e) => setQForm({ ...qForm, optC: e.target.value })} />
                            <input style={styles.input} placeholder="Đáp án D" required value={qForm.optD} onChange={(e) => setQForm({ ...qForm, optD: e.target.value })} />
                            <select style={styles.input} value={qForm.correctOption} onChange={(e) => setQForm({ ...qForm, correctOption: e.target.value })}>
                                <option value="A">Đáp án đúng: A</option>
                                <option value="B">Đáp án đúng: B</option>
                                <option value="C">Đáp án đúng: C</option>
                                <option value="D">Đáp án đúng: D</option>
                            </select>
                            <button style={styles.btnPrimary} type="submit">{editingId ? 'Cập nhật' : 'Lưu câu hỏi'}</button>
                        </form>
                    </div>
                    <div style={styles.card}>
                        <h3>Danh sách câu hỏi</h3>
                        {questions.map((q, index) => (
                            <div key={q._id} style={styles.itemBox}>
                                <b>Câu {index + 1}: {q.content}</b>
                                <ul style={{ margin: '8px 0', paddingLeft: 20, fontSize: 14 }}>
                                    {q.options.map((o) => (
                                        <li key={o.key} style={{ color: o.key === q.correctOption ? '#16a34a' : '#334155', fontWeight: o.key === q.correctOption ? 'bold' : 'normal' }}>
                                            {o.key}. {o.text} {o.key === q.correctOption && '✓'}
                                        </li>
                                    ))}
                                </ul>
                                <button style={styles.btnSmallDanger} onClick={() => handleDeleteQuestion(q._id)}>Xóa</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'exams' && user.role === 'teacher' && (
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <h3>Tạo Đề Thi Mới</h3>
                        <form onSubmit={handleCreateExam} style={styles.form}>
                            <input style={styles.input} placeholder="Tên đề thi" required value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} />
                            <input style={styles.input} placeholder="Mô tả" value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} />
                            <input style={styles.input} type="number" min="1" placeholder="Thời gian (phút)" required value={examForm.durationMinutes} onChange={(e) => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })} />
                            <input style={styles.input} placeholder="Mã phòng (để trống tự sinh)" value={examForm.roomCode} onChange={(e) => setExamForm({ ...examForm, roomCode: e.target.value })} />
                            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', padding: 10 }}>
                                <b>Chọn câu hỏi ({selectedQIds.length}):</b>
                                {questions.map((q, idx) => (
                                    <label key={q._id} style={{ display: 'block', marginTop: 6, fontSize: 14 }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedQIds.includes(q._id)}
                                            onChange={() => setSelectedQIds((prev) => (prev.includes(q._id) ? prev.filter((i) => i !== q._id) : [...prev, q._id]))}
                                        />{' '}
                                        Câu {idx + 1}: {q.content}
                                    </label>
                                ))}
                            </div>
                            <button style={styles.btnPrimary} type="submit">Tạo đề thi</button>
                        </form>
                    </div>
                    <div style={styles.card}>
                        <h3>Danh sách Đề thi</h3>
                        {exams.map((ex) => (
                            <div key={ex._id} style={styles.itemBox}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <b>{ex.title}</b>
                                    <span style={styles.roomBadge}>Mã: {ex.roomCode}</span>
                                </div>
                                <p style={{ fontSize: 13, color: '#64748b' }}>Thời gian: {ex.durationMinutes} phút | Số câu: {ex.questionCount}</p>
                                <button style={styles.btnSmall} onClick={() => handleViewParticipants(ex._id)}>Xem bảng điểm lớp</button>
                            </div>
                        ))}
                        {participantsData && (
                            <div style={{ marginTop: 14, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                                <h4 style={{ marginTop: 0 }}>Bảng điểm: {participantsData.examTitle}</h4>
                                {participantsData.results.length === 0 ? (
                                    <p style={{ fontSize: 13 }}>Chưa có sinh viên nộp bài.</p>
                                ) : (
                                    participantsData.results.map((r) => (
                                        <div key={r.resultId} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                                            {r.studentName} ({r.studentCode}) — <b>{r.score} điểm</b>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === 'roomTest' && (
                <div style={styles.card}>
                    <h3>Tra cứu & Vào Phòng Thi</h3>
                    <div style={{ display: 'flex', gap: 10, maxWidth: 400 }}>
                        <input style={styles.input} placeholder="Nhập mã phòng (VD: 001)" value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase())} />
                        <button style={styles.btnPrimary} onClick={handleSearchRoom}>Tìm phòng</button>
                    </div>

                    {foundExam && !examResult && (
                        <div style={{ ...styles.itemBox, marginTop: 16, background: '#f0fdf4', borderColor: '#86efac' }}>
                            <h4 style={{ margin: '0 0 6px 0', color: '#166534' }}>{foundExam.title}</h4>
                            <p style={{ margin: '4px 0', fontSize: 14 }}>{foundExam.description}</p>
                            <p style={{ margin: '4px 0 14px 0', fontSize: 14 }}>
                                Giáo viên ra đề: <b>{foundExam.teacherName}</b> | Thời gian: <b>{foundExam.durationMinutes} phút</b> | Số câu: <b>{foundExam.questionCount}</b>
                            </p>
                            <button style={{ ...styles.btnPrimary, background: '#16a34a', fontSize: 15, padding: '12px 24px' }} onClick={() => handleStartExam(foundExam._id)}>
                                🚀 Bắt đầu làm bài ngay
                            </button>
                        </div>
                    )}

                    {examResult && (
                        <div style={{ ...styles.itemBox, marginTop: 16, background: '#eff6ff', borderColor: '#93c5fd', textAlign: 'center' }}>
                            <h3 style={{ color: '#1d4ed8', marginTop: 0 }}>🎉 Hoàn thành bài thi: {examResult.examTitle}</h3>
                            <p style={{ fontSize: 24, fontWeight: 'bold', margin: '10px 0', color: '#16a34a' }}>Điểm số: {examResult.score} / 10</p>
                            <p style={{ fontSize: 15 }}>Số câu đúng: <b>{examResult.correctCount} / {examResult.totalQuestions}</b> câu</p>
                            <button style={styles.btnPrimary} onClick={() => setExamResult(null)}>Quay lại</button>
                        </div>
                    )}
                </div>
            )}
            {tab === 'history' && (
                <div style={styles.card}>
                    <h3>Lịch sử bài thi đã nộp</h3>
                    {history.length === 0 ? (
                        <p style={{ color: '#64748b' }}>Bạn chưa hoàn thành bài thi nào.</p>
                    ) : (
                        history.map((h) => (
                            <div key={h._id} style={styles.itemBox}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <b>{h.examId?.title || 'Đề thi'} (Mã: {h.examId?.roomCode})</b>
                                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{h.score} / 10 điểm</span>
                                </div>
                                <span style={{ fontSize: 13, color: '#64748b' }}>
                                    Đúng {h.correctCount}/{h.totalQuestions} câu • Nộp lúc: {new Date(h.createdAt || h.submittedAt).toLocaleString('vi-VN')}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    authContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' },
    container: { maxWidth: 1100, margin: '0 auto', padding: 20, fontFamily: 'sans-serif', color: '#1e293b' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', color: '#fff', padding: '16px 24px', borderRadius: 10, marginBottom: 20 },
    badge: { background: '#3b82f6', padding: '2px 8px', borderRadius: 4, fontSize: 11 },
    roomBadge: { background: '#fef08a', color: '#854d0e', padding: '4px 10px', borderRadius: 6, fontWeight: 'bold', fontSize: 13 },
    nav: { display: 'flex', gap: 10, marginBottom: 20 },
    tab: { padding: '10px 16px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 500 },
    tabActive: { padding: '10px 16px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, alignItems: 'start' },
    card: { background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
    form: { display: 'flex', flexDirection: 'column', gap: 12 },
    input: { padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, width: '100%', boxSizing: 'border-box' },
    btnPrimary: { padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
    btnDanger: { padding: '8px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
    btnLink: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginTop: 10, textDecoration: 'underline' },
    btnSmall: { padding: '5px 10px', background: '#e2e8f0', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
    btnSmallDanger: { padding: '5px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
    itemBox: { padding: 14, border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12 },
};