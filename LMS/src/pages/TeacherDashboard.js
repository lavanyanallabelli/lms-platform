import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, createCourse, deleteCourse } from '../firebase/firestore';
import CourseForm from '../components/CourseForm';
import LoadingSpinner from '../components/LoadingSpinner';

const TeacherDashboard = ({ user, userProfile }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [error, setError] = useState('');

    const loadCourses = useCallback(async () => {
        setLoading(true);
        const result = await getCourses(user.uid);
        if (result.success) {
            setCourses(result.data);
        } else {
            setError(result.error);
        }
        setLoading(false);
    }, [user.uid]);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    const handleCreateCourse = async (courseData) => {
        const result = await createCourse({
            ...courseData,
            teacherId: user.uid,
            teacherName: userProfile.name,
            lessons: [],
            createdAt: new Date().toISOString()
        });

        if (result.success) {
            setShowCourseForm(false);
            loadCourses();
        } else {
            setError(result.error);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            const result = await deleteCourse(courseId);
            if (result.success) {
                loadCourses();
            } else {
                setError(result.error);
            }
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary-800 dark:text-primary-200">
                        Teacher Dashboard
                    </h1>
                    <p className="text-primary-600 dark:text-primary-400 mt-2">
                        Welcome back, {userProfile?.name}! Manage your courses and track student progress.
                    </p>
                </div>
                <button
                    onClick={() => setShowCourseForm(true)}
                    className="btn-primary"
                >
                    Create New Course
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 bg-primary-100 dark:bg-primary-700 rounded-lg">
                            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Total Courses</p>
                            <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">{courses.length}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 bg-primary-100 dark:bg-primary-700 rounded-lg">
                            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Total Lessons</p>
                            <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                                {courses.reduce((total, course) => total + (course.lessons?.length || 0), 0)}
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
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Active Students</p>
                            <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Courses List */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">My Courses</h2>
                </div>

                {courses.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-primary-800 dark:text-primary-200">No courses</h3>
                        <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">Get started by creating a new course.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => setShowCourseForm(true)}
                                className="btn-primary"
                            >
                                Create Course
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div key={course.id} className="border border-primary-200 dark:border-primary-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                                        {course.title}
                                    </h3>
                                    <div className="flex space-x-2">
                                        <Link
                                            to={`/course/${course.id}`}
                                            className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteCourse(course.id)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <p className="text-primary-600 dark:text-primary-400 text-sm mb-4 line-clamp-2">
                                    {course.description}
                                </p>

                                <div className="flex justify-between items-center text-sm text-primary-500 dark:text-primary-500">
                                    <span>{course.lessons?.length || 0} lessons</span>
                                    <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Course Form Modal */}
            {showCourseForm && (
                <CourseForm
                    onSubmit={handleCreateCourse}
                    onCancel={() => setShowCourseForm(false)}
                />
            )}
        </div>
    );
};

export default TeacherDashboard;
