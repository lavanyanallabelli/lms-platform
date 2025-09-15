import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourse, updateCourse, getQuizzes, createQuiz, getLessonProgress } from '../firebase/firestore';
import LessonForm from '../components/LessonForm';
import QuizForm from '../components/QuizForm';
import AIQuizGenerator from '../components/AIQuizGenerator';
import LessonViewer from '../components/LessonViewer';
import LoadingSpinner from '../components/LoadingSpinner';

const CourseDetail = ({ user, userProfile, onProgressUpdate }) => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [lessonProgress, setLessonProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLessonForm, setShowLessonForm] = useState(false);
    const [showQuizForm, setShowQuizForm] = useState(false);
    const [showAIQuizGenerator, setShowAIQuizGenerator] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [error, setError] = useState('');

    const loadCourseData = useCallback(async () => {
        setLoading(true);
        const [courseResult, quizzesResult, progressResult] = await Promise.all([
            getCourse(courseId),
            getQuizzes(courseId),
            userProfile?.role === 'student' ? getLessonProgress(user.uid, courseId) : Promise.resolve({ success: true, data: [] })
        ]);

        if (courseResult.success) {
            setCourse(courseResult.data);
        } else {
            setError(courseResult.error);
        }

        if (quizzesResult.success) {
            setQuizzes(quizzesResult.data);
        }

        if (progressResult.success) {
            setLessonProgress(progressResult.data);
        }

        setLoading(false);
    }, [courseId, user.uid, userProfile?.role]);

    useEffect(() => {
        loadCourseData();
    }, [courseId, loadCourseData]);

    const handleAddLesson = async (lessonData) => {
        const newLesson = {
            id: Date.now().toString(),
            ...lessonData,
            createdAt: new Date().toISOString()
        };

        const updatedLessons = [...(course.lessons || []), newLesson];
        const result = await updateCourse(courseId, { lessons: updatedLessons });

        if (result.success) {
            setCourse({ ...course, lessons: updatedLessons });
            setShowLessonForm(false);
        } else {
            setError(result.error);
        }
    };

    const handleEditLesson = async (lessonId, lessonData) => {
        const updatedLessons = course.lessons.map(lesson =>
            lesson.id === lessonId ? { ...lesson, ...lessonData } : lesson
        );

        const result = await updateCourse(courseId, { lessons: updatedLessons });

        if (result.success) {
            setCourse({ ...course, lessons: updatedLessons });
            setEditingLesson(null);
        } else {
            setError(result.error);
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (window.confirm('Are you sure you want to delete this lesson?')) {
            const updatedLessons = course.lessons.filter(lesson => lesson.id !== lessonId);
            const result = await updateCourse(courseId, { lessons: updatedLessons });

            if (result.success) {
                setCourse({ ...course, lessons: updatedLessons });
            } else {
                setError(result.error);
            }
        }
    };

    const handleCreateQuiz = async (quizData) => {
        const result = await createQuiz({
            ...quizData,
            courseId: courseId,
            createdAt: new Date().toISOString()
        });

        if (result.success) {
            loadCourseData();
            setShowQuizForm(false);
        } else {
            setError(result.error);
        }
    };

    const getLessonProgressStatus = (lessonId) => {
        const progress = lessonProgress.find(p => p.lessonId === lessonId);
        return progress ? progress.status : 'not_started';
    };

    const handleLessonComplete = (lessonId) => {
        // Reload progress data when a lesson is completed
        loadCourseData();
        // Notify parent component to refresh progress
        if (onProgressUpdate) {
            onProgressUpdate();
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!course) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-200">Course not found</h2>
                <Link to="/dashboard" className="btn-primary mt-4 inline-block">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <Link to="/dashboard" className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 mb-4 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-primary-800 dark:text-primary-200">
                        {course.title}
                    </h1>
                    <p className="text-primary-600 dark:text-primary-400 mt-2">
                        {course.description}
                    </p>
                </div>
                {/* Only show teacher controls to teachers */}
                {userProfile?.role === 'teacher' && (
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowLessonForm(true)}
                            className="btn-primary"
                        >
                            Add Lesson
                        </button>
                        <button
                            onClick={() => setShowQuizForm(true)}
                            className="btn-secondary"
                        >
                            Create Quiz
                        </button>
                        <button
                            onClick={() => setShowAIQuizGenerator(true)}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                            🤖 AI Quiz Generator
                        </button>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Course Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 bg-primary-100 dark:bg-primary-700 rounded-lg">
                            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Lessons</p>
                            <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                                {course.lessons?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 bg-primary-100 dark:bg-primary-700 rounded-lg">
                            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Quizzes</p>
                            <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                                {quizzes.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 bg-primary-100 dark:bg-primary-700 rounded-lg">
                            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Enrolled Students</p>
                            <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lessons Section */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">Lessons</h2>
                </div>

                {course.lessons?.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-primary-600 dark:text-primary-400">No lessons yet. Create your first lesson to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {course.lessons.map((lesson, index) => {
                            const progressStatus = getLessonProgressStatus(lesson.id);
                            return (
                                <div key={lesson.id} className="border border-primary-200 dark:border-primary-700 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <span className="bg-primary-100 dark:bg-primary-700 text-primary-600 dark:text-primary-400 text-sm font-medium px-2 py-1 rounded">
                                                    Lesson {index + 1}
                                                </span>
                                                <span className="badge badge-info">
                                                    {lesson.contentType}
                                                </span>
                                                {userProfile?.role === 'student' && (
                                                    <span className={`badge ${progressStatus === 'completed' ? 'badge-success' :
                                                        progressStatus === 'opened' ? 'badge-warning' :
                                                            'badge-secondary'
                                                        }`}>
                                                        {progressStatus === 'completed' ? 'Completed' :
                                                            progressStatus === 'opened' ? 'In Progress' :
                                                                'Not Started'}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-2">
                                                {lesson.title}
                                            </h3>
                                            {lesson.contentType === 'text' && (
                                                <p className="text-primary-600 dark:text-primary-400 text-sm line-clamp-3">
                                                    {lesson.content}
                                                </p>
                                            )}
                                            {lesson.contentType === 'video' && (
                                                <p className="text-primary-600 dark:text-primary-400 text-sm">
                                                    Video: {lesson.content}
                                                </p>
                                            )}
                                            {lesson.contentType === 'pdf' && (
                                                <p className="text-primary-600 dark:text-primary-400 text-sm">
                                                    PDF: {lesson.content}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex space-x-2 ml-4">
                                            {/* Student view lesson button */}
                                            {userProfile?.role === 'student' && (
                                                <button
                                                    onClick={() => setSelectedLesson(lesson)}
                                                    className="btn-primary text-sm"
                                                >
                                                    {progressStatus === 'completed' ? 'Review' : 'View Lesson'}
                                                </button>
                                            )}

                                            {/* Teacher edit/delete buttons */}
                                            {userProfile?.role === 'teacher' && (
                                                <>
                                                    <button
                                                        onClick={() => setEditingLesson(lesson)}
                                                        className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLesson(lesson.id)}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quizzes Section */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">Quizzes</h2>
                </div>

                {quizzes.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-primary-600 dark:text-primary-400">No quizzes yet. Create your first quiz to assess student learning.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="border border-primary-200 dark:border-primary-700 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-2">
                                            {quiz.title}
                                        </h3>
                                        <p className="text-primary-600 dark:text-primary-400 text-sm mb-2">
                                            {quiz.questions?.length || 0} questions
                                        </p>
                                        <p className="text-primary-500 dark:text-primary-500 text-xs">
                                            Created: {new Date(quiz.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        {userProfile?.role === 'student' ? (
                                            <Link
                                                to={`/quiz/${quiz.id}`}
                                                className="btn-primary text-sm"
                                            >
                                                Take Quiz
                                            </Link>
                                        ) : (
                                            <Link
                                                to={`/quiz/${quiz.id}`}
                                                className="btn-secondary text-sm"
                                            >
                                                Preview Quiz
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Forms - Only show for teachers */}
            {userProfile?.role === 'teacher' && (
                <>
                    {showLessonForm && (
                        <LessonForm
                            onSubmit={handleAddLesson}
                            onCancel={() => setShowLessonForm(false)}
                        />
                    )}

                    {editingLesson && (
                        <LessonForm
                            initialData={editingLesson}
                            onSubmit={(data) => handleEditLesson(editingLesson.id, data)}
                            onCancel={() => setEditingLesson(null)}
                        />
                    )}

                    {showQuizForm && (
                        <QuizForm
                            onSubmit={handleCreateQuiz}
                            onCancel={() => setShowQuizForm(false)}
                        />
                    )}

                    {showAIQuizGenerator && (
                        <AIQuizGenerator
                            onSubmit={handleCreateQuiz}
                            onCancel={() => setShowAIQuizGenerator(false)}
                        />
                    )}
                </>
            )}

            {/* Lesson Viewer Modal */}
            {selectedLesson && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-primary-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">
                                    Lesson Viewer
                                </h2>
                                <button
                                    onClick={() => setSelectedLesson(null)}
                                    className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <LessonViewer
                                lesson={selectedLesson}
                                courseId={courseId}
                                user={user}
                                onComplete={handleLessonComplete}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseDetail;
