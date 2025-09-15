import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getStudentResults, getLessonProgress } from '../firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

const MyLearning = ({ user, userProfile }) => {
    const [courses, setCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [results, setResults] = useState([]);
    const [lessonProgress, setLessonProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState('');

    const loadLearningData = useCallback(async () => {
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
        loadLearningData();

        // Listen for progress updates from other components
        const handleRefreshProgress = () => {
            refreshLessonProgress();
        };

        window.addEventListener('refreshProgress', handleRefreshProgress);

        return () => {
            window.removeEventListener('refreshProgress', handleRefreshProgress);
        };
    }, [loadLearningData, refreshLessonProgress]);

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
        const courseResults = results.filter(r => r.courseId === courseId);
        if (courseResults.length === 0) return 0;

        const sum = courseResults.reduce((acc, result) => acc + result.score, 0);
        return Math.round(sum / courseResults.length);
    };

    const getRecentActivity = () => {
        const recentResults = results.slice(0, 5);
        const recentProgress = lessonProgress.slice(0, 5);

        const activities = [];

        // Add recent quiz results
        recentResults.forEach(result => {
            const course = courses.find(c => c.id === result.courseId);
            activities.push({
                id: `quiz-${result.id}`,
                type: 'quiz',
                title: `Quiz completed in ${course?.title || 'Unknown Course'}`,
                description: `Score: ${result.score}%`,
                timestamp: result.timestamp,
                courseId: result.courseId
            });
        });

        // Add recent lesson progress
        recentProgress.forEach(progress => {
            const course = courses.find(c => c.id === progress.courseId);
            const lesson = course?.lessons?.find(l => l.id === progress.lessonId);
            activities.push({
                id: `lesson-${progress.id}`,
                type: 'lesson',
                title: `${progress.status === 'completed' ? 'Completed' : 'Started'} lesson`,
                description: lesson?.title || 'Unknown Lesson',
                timestamp: progress.timestamp,
                courseId: progress.courseId
            });
        });

        // Sort by timestamp and return top 10
        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-primary-50 dark:bg-primary-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-primary-800 dark:text-primary-200 mb-2">
                        My Learning Journey
                    </h1>
                    <p className="text-primary-600 dark:text-primary-400">
                        Track your progress and continue your learning adventure
                    </p>
                </div>

                {/* Learning Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="card">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Enrolled Courses</p>
                                <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                                    {enrolledCourses.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Lessons Completed</p>
                                <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                                    {lessonProgress.filter(p => p.status === 'completed').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Quizzes Taken</p>
                                <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                                    {results.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Average Score</p>
                                <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                                    {results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* My Courses Progress */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">Course Progress</h2>
                            <p className="text-primary-600 dark:text-primary-400 text-sm mt-1">
                                Your learning progress across all courses
                            </p>
                        </div>
                        <div className="space-y-4">
                            {enrolledCourses.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-primary-400 dark:text-primary-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <p className="text-primary-600 dark:text-primary-400 mb-4">You haven't enrolled in any courses yet</p>
                                    <Link to="/dashboard" className="btn-primary">
                                        Browse Courses
                                    </Link>
                                </div>
                            ) : (
                                enrolledCourses.map((course) => {
                                    const progress = getCourseProgress(course.id);
                                    const avgScore = getAverageScore(course.id);

                                    return (
                                        <Link
                                            key={course.id}
                                            to={`/course/${course.id}`}
                                            className="block border border-primary-200 dark:border-primary-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-primary-300 dark:hover:border-primary-600"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-semibold text-primary-800 dark:text-primary-200">
                                                    {course.title}
                                                </h3>
                                                <span className="text-sm text-primary-600 dark:text-primary-400">
                                                    {progress.percentage}%
                                                </span>
                                            </div>

                                            <div className="mb-3">
                                                <div className="flex justify-between text-sm text-primary-600 dark:text-primary-400 mb-1">
                                                    <span>Progress</span>
                                                    <span>{progress.completed}/{progress.total} lessons</span>
                                                </div>
                                                <div className="w-full bg-primary-200 dark:bg-primary-700 rounded-full h-2">
                                                    <div
                                                        className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${progress.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {avgScore > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-primary-600 dark:text-primary-400">Average Quiz Score</span>
                                                    <span className={`font-medium ${avgScore >= 80 ? 'text-green-600 dark:text-green-400' :
                                                        avgScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                                            'text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {avgScore}%
                                                    </span>
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">Recent Activity</h2>
                            <p className="text-primary-600 dark:text-primary-400 text-sm mt-1">
                                Your latest learning activities
                            </p>
                        </div>
                        <div className="space-y-3">
                            {getRecentActivity().length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-primary-400 dark:text-primary-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-primary-600 dark:text-primary-400">No recent activity</p>
                                    <p className="text-sm text-primary-500 dark:text-primary-500 mt-1">
                                        Start learning to see your activity here
                                    </p>
                                </div>
                            ) : (
                                getRecentActivity().map((activity) => (
                                    <div key={activity.id} className="flex items-start space-x-3 p-3 border border-primary-200 dark:border-primary-700 rounded-lg">
                                        <div className={`p-2 rounded-lg ${activity.type === 'quiz' ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-green-100 dark:bg-green-900/20'
                                            }`}>
                                            <svg className={`w-4 h-4 ${activity.type === 'quiz' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {activity.type === 'quiz' ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                )}
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-primary-800 dark:text-primary-200 text-sm">
                                                {activity.title}
                                            </h4>
                                            <p className="text-sm text-primary-600 dark:text-primary-400">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-primary-500 dark:text-primary-500 mt-1">
                                                {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyLearning;
