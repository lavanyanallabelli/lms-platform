import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, updateUserProgress, getStudentResults, getLessonProgress } from '../firebase/firestore';
import { generateRecommendations } from '../utils/aiRecommendations';
import LoadingSpinner from '../components/LoadingSpinner';
import AIStudyPlan from '../components/AIStudyPlan';

const StudentDashboard = ({ user, userProfile }) => {
    const [courses, setCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [results, setResults] = useState([]);
    const [lessonProgress, setLessonProgress] = useState([]);
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAIStudyPlan, setShowAIStudyPlan] = useState(false);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);

        // Load all available courses
        const coursesResult = await getCourses();
        if (coursesResult.success) {
            setCourses(coursesResult.data);
        }

        // Load student results
        const resultsResult = await getStudentResults(user.uid);
        if (resultsResult.success) {
            setResults(resultsResult.data);
        }

        // Load lesson progress
        const progressResult = await getLessonProgress(user.uid);
        if (progressResult.success) {
            setLessonProgress(progressResult.data);
        }

        // Get enrolled courses from user progress
        const enrolledCourseIds = Object.keys(userProfile.progress || {});
        const enrolled = coursesResult.success
            ? coursesResult.data.filter(course => enrolledCourseIds.includes(course.id))
            : [];
        setEnrolledCourses(enrolled);

        setLoading(false);
    }, [user.uid, userProfile.progress]);

    const refreshLessonProgress = useCallback(async () => {
        const progressResult = await getLessonProgress(user.uid);
        if (progressResult.success) {
            setLessonProgress(progressResult.data);
        }
    }, [user.uid]);

    useEffect(() => {
        loadDashboardData();

        // Listen for progress updates from other components
        const handleRefreshProgress = () => {
            refreshLessonProgress();
        };

        window.addEventListener('refreshProgress', handleRefreshProgress);

        return () => {
            window.removeEventListener('refreshProgress', handleRefreshProgress);
        };
    }, [loadDashboardData, refreshLessonProgress]);

    const handleEnrollCourse = async (courseId) => {
        const result = await updateUserProgress(user.uid, courseId, {
            completedLessons: [],
            quizScores: [],
            enrolledAt: new Date().toISOString()
        });

        if (result.success) {
            // Update local enrolled courses immediately
            const courseToEnroll = courses.find(c => c.id === courseId);
            if (courseToEnroll) {
                setEnrolledCourses(prev => [...prev, courseToEnroll]);
            }

            // Also reload dashboard data to ensure everything is in sync
            loadDashboardData();
        } else {
            setError(result.error);
        }
    };

    const getCourseProgress = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        const totalLessons = course?.lessons?.length || 0;

        if (totalLessons === 0) return { completed: 0, total: 0, percentage: 0 };

        // Get completed lessons from the new lessonProgress collection
        const courseProgress = lessonProgress.filter(p => p.courseId === courseId);
        const completedLessons = courseProgress.filter(p => p.status === 'completed');
        const uniqueCompletedLessons = [...new Set(completedLessons.map(p => p.lessonId))];

        const completed = uniqueCompletedLessons.length;
        const percentage = Math.round((completed / totalLessons) * 100);

        return { completed, total: totalLessons, percentage };
    };

    const getAverageScore = (courseId) => {
        const progress = userProfile.progress?.[courseId];
        if (!progress?.quizScores || progress.quizScores.length === 0) return 0;

        const sum = progress.quizScores.reduce((acc, score) => acc + score, 0);
        return Math.round(sum / progress.quizScores.length);
    };

    const getBasicRecommendations = useCallback(() => {
        if (results.length === 0) return [];

        const recentResult = results[0];

        return [{
            id: 'basic-1',
            type: recentResult.score < 50 ? 'remedial' : recentResult.score < 80 ? 'practice' : 'advanced',
            title: recentResult.score < 50 ? 'Review Basic Concepts' :
                recentResult.score < 80 ? 'Practice More Problems' : 'Challenge Yourself',
            description: recentResult.score < 50 ?
                `Your recent quiz score of ${recentResult.score}% suggests reviewing the fundamentals.` :
                recentResult.score < 80 ?
                    `Great progress with ${recentResult.score}%! Try some additional practice problems.` :
                    `Excellent work with ${recentResult.score}%! You're ready for advanced topics.`,
            priority: 'high',
            aiGenerated: false
        }];
    }, [results]);

    const generateAIRecommendations = useCallback(async () => {
        if (results.length === 0) return;

        setLoadingRecommendations(true);
        try {
            // Get the most recent quiz result for AI analysis
            const recentResult = results[0];
            const course = courses.find(c => c.id === recentResult.courseId);

            if (!course) {
                setLoadingRecommendations(false);
                return;
            }

            // Generate AI recommendations based on recent performance
            const recommendations = await generateRecommendations(
                recentResult.score,
                course.title,
                recentResult.answers || [],
                course.description,
                [] // available resources - could be expanded later
            );

            setAiRecommendations(recommendations.slice(0, 3)); // Show top 3 recommendations
        } catch (error) {
            console.error('Error generating AI recommendations:', error);
            // Fallback to basic recommendations
            setAiRecommendations(getBasicRecommendations());
        }
        setLoadingRecommendations(false);
    }, [results, courses, getBasicRecommendations]);

    // Generate AI recommendations when results or courses change
    useEffect(() => {
        if (results.length > 0 && courses.length > 0) {
            generateAIRecommendations();
        }
    }, [results, courses, generateAIRecommendations]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-primary-800 dark:text-primary-200">
                        Student Dashboard
                    </h1>
                    <p className="text-primary-600 dark:text-primary-400 mt-2">
                        Welcome back, {userProfile?.name}! Continue your learning journey.
                    </p>
                </div>
                <button
                    onClick={() => setShowAIStudyPlan(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                    🤖 AI Study Plan
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 bg-primary-100 dark:bg-primary-700 rounded-lg">
                            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Enrolled Courses</p>
                            <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">{enrolledCourses.length}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 bg-primary-100 dark:bg-primary-700 rounded-lg">
                            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Completed Lessons</p>
                            <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                                {enrolledCourses.reduce((total, course) => {
                                    const progress = getCourseProgress(course.id);
                                    return total + progress.completed;
                                }, 0)}
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
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Quizzes Taken</p>
                            <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">{results.length}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 bg-primary-100 dark:bg-primary-700 rounded-lg">
                            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Average Score</p>
                            <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                                {results.length > 0
                                    ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length)
                                    : 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Recommendations */}
            {(aiRecommendations.length > 0 || loadingRecommendations) && (
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">AI Recommendations</h2>
                                <p className="text-primary-600 dark:text-primary-400 text-sm mt-1">
                                    Personalized learning suggestions based on your performance
                                </p>
                            </div>
                            {!loadingRecommendations && aiRecommendations.length > 0 && (
                                <button
                                    onClick={generateAIRecommendations}
                                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors"
                                    title="Refresh recommendations"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            )}
                            {loadingRecommendations && (
                                <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm">Generating recommendations...</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {loadingRecommendations ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <svg className="animate-spin h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-primary-600 dark:text-primary-400">AI is analyzing your performance...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {aiRecommendations.map((rec) => (
                                <div key={rec.id} className="border border-primary-200 dark:border-primary-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start space-x-3">
                                        <div className={`p-2 rounded-lg ${rec.type === 'remedial' ? 'bg-red-100 dark:bg-red-900/20' :
                                            rec.type === 'practice' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                                                rec.type === 'advanced' ? 'bg-green-100 dark:bg-green-900/20' :
                                                    'bg-blue-100 dark:bg-blue-900/20'
                                            }`}>
                                            <svg className={`w-5 h-5 ${rec.type === 'remedial' ? 'text-red-600 dark:text-red-400' :
                                                rec.type === 'practice' ? 'text-yellow-600 dark:text-yellow-400' :
                                                    rec.type === 'advanced' ? 'text-green-600 dark:text-green-400' :
                                                        'text-blue-600 dark:text-blue-400'
                                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h3 className="font-medium text-primary-800 dark:text-primary-200">{rec.title}</h3>
                                                {rec.aiGenerated && (
                                                    <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
                                                        AI
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">{rec.description}</p>
                                            {rec.priority && (
                                                <div className="mt-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                                                        rec.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                                                            'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                                        }`}>
                                                        {rec.priority} priority
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Enrolled Courses */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">My Courses</h2>
                </div>

                {enrolledCourses.length === 0 ? (
                    <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-primary-800 dark:text-primary-200">No enrolled courses</h3>
                        <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">Browse available courses below to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map((course) => {
                            const progress = getCourseProgress(course.id);
                            const avgScore = getAverageScore(course.id);

                            return (
                                <Link
                                    key={course.id}
                                    to={`/course/${course.id}`}
                                    className="block border border-primary-200 dark:border-primary-700 rounded-lg p-6 hover:shadow-md transition-shadow hover:border-primary-300 dark:hover:border-primary-600"
                                >
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                                            {course.title}
                                        </h3>
                                    </div>

                                    <p className="text-primary-600 dark:text-primary-400 text-sm mb-4 line-clamp-2">
                                        {course.description}
                                    </p>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-sm text-primary-600 dark:text-primary-400 mb-1">
                                                <span>Progress</span>
                                                <span>{progress.percentage}%</span>
                                            </div>
                                            <div className="w-full bg-primary-200 dark:bg-primary-700 rounded-full h-2">
                                                <div
                                                    className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${progress.percentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-primary-500 dark:text-primary-500 mt-1">
                                                {progress.completed} of {progress.total} lessons completed
                                            </p>
                                        </div>

                                        {avgScore > 0 && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-primary-600 dark:text-primary-400">Average Score</span>
                                                <span className={`font-medium ${avgScore >= 80 ? 'text-green-600 dark:text-green-400' :
                                                    avgScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                                        'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {avgScore}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Available Courses */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">Available Courses</h2>
                    <p className="text-primary-600 dark:text-primary-400 text-sm mt-1">
                        Enroll in new courses to expand your learning
                    </p>
                </div>

                {courses.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-primary-600 dark:text-primary-400">No courses available at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.filter(course => !enrolledCourses.find(ec => ec.id === course.id)).map((course) => (
                            <div key={course.id} className="border border-primary-200 dark:border-primary-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                                        {course.title}
                                    </h3>
                                    <span className="badge badge-info">
                                        {course.subject}
                                    </span>
                                </div>

                                <p className="text-primary-600 dark:text-primary-400 text-sm mb-4 line-clamp-2">
                                    {course.description}
                                </p>

                                <div className="flex justify-between items-center text-sm text-primary-500 dark:text-primary-500 mb-4">
                                    <span>By {course.teacherName}</span>
                                    <span>{course.lessons?.length || 0} lessons</span>
                                </div>

                                <button
                                    onClick={() => handleEnrollCourse(course.id)}
                                    className="w-full btn-primary"
                                >
                                    Enroll Now
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Study Plan Modal */}
            {showAIStudyPlan && (
                <AIStudyPlan
                    userProfile={userProfile}
                    user={user}
                    onClose={() => setShowAIStudyPlan(false)}
                />
            )}
        </div>
    );
};

export default StudentDashboard;
