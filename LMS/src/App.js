import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChange, getUserProfile } from './firebase/auth';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import MyLearning from './pages/MyLearning';
import CourseDetail from './pages/CourseDetail';
import QuizTaking from './pages/QuizTaking';
import StudyPlans from './pages/StudyPlans';
import PDFStudyTool from './pages/PDFStudyTool';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

// Import test utilities for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
    import('./tests/testStudyPlan').then(module => {
        window.testStudyPlan = module.default;
    });
}

function App() {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            if (user) {
                const profileResult = await getUserProfile(user.uid);
                if (profileResult.success) {
                    setUserProfile(profileResult.data);
                }
                setUser(user);
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <ThemeProvider>
            <Router>
                <div className="min-h-screen bg-primary-50 dark:bg-primary-900 transition-colors duration-200">
                    {user && <Navbar user={user} userProfile={userProfile} />}

                    <main className="container mx-auto px-4 py-8">
                        <Routes>
                            <Route
                                path="/login"
                                element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
                            />
                            <Route
                                path="/register"
                                element={!user ? <Register /> : <Navigate to="/dashboard" replace />}
                            />
                            <Route
                                path="/dashboard"
                                element={
                                    user ? (
                                        userProfile?.role === 'teacher' ?
                                            <TeacherDashboard user={user} userProfile={userProfile} /> :
                                            <StudentDashboard user={user} userProfile={userProfile} />
                                    ) : (
                                        <Navigate to="/login" replace />
                                    )
                                }
                            />
                            <Route
                                path="/my-learning"
                                element={
                                    user && userProfile?.role === 'student' ? (
                                        <MyLearning user={user} userProfile={userProfile} />
                                    ) : (
                                        <Navigate to="/dashboard" replace />
                                    )
                                }
                            />
                            <Route
                                path="/course/:courseId"
                                element={
                                    user ? <CourseDetail user={user} userProfile={userProfile} onProgressUpdate={() => window.dispatchEvent(new CustomEvent('refreshProgress'))} /> :
                                        <Navigate to="/login" replace />
                                }
                            />
                            <Route
                                path="/quiz/:quizId"
                                element={
                                    user ? <QuizTaking user={user} userProfile={userProfile} /> :
                                        <Navigate to="/login" replace />
                                }
                            />
                            <Route
                                path="/study-plans"
                                element={
                                    user && userProfile?.role === 'student' ?
                                        <StudyPlans user={user} userProfile={userProfile} /> :
                                        <Navigate to="/dashboard" replace />
                                }
                            />
                            <Route
                                path="/pdf-study-tool"
                                element={
                                    user && userProfile?.role === 'student' ?
                                        <PDFStudyTool user={user} userProfile={userProfile} /> :
                                        <Navigate to="/dashboard" replace />
                                }
                            />
                            <Route
                                path="/"
                                element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
                            />
                        </Routes>
                    </main>
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;
