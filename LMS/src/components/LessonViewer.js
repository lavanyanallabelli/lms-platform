import React, { useState, useEffect, useCallback } from 'react';
import { updateLessonProgress, getLessonProgress } from '../firebase/firestore';
import StudyNotes from './StudyNotes';

const LessonViewer = ({ lesson, courseId, user, onComplete }) => {
    const [progress, setProgress] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showNotes, setShowNotes] = useState(false);

    const loadProgress = useCallback(async () => {
        const result = await getLessonProgress(user.uid, courseId);
        if (result.success) {
            const lessonProgress = result.data.find(p => p.lessonId === lesson.id);
            if (lessonProgress) {
                setProgress(lessonProgress);
                setIsCompleted(lessonProgress.status === 'completed');
            }
        }
    }, [user.uid, courseId, lesson.id]);

    const markLessonOpened = useCallback(async () => {
        if (!progress) {
            try {
                await updateLessonProgress(user.uid, lesson.id, 'opened', courseId);
            } catch (error) {
                console.error('Failed to mark lesson as opened:', error);
                // Don't show error to user as this is not critical
            }
        }
    }, [progress, user.uid, lesson.id, courseId]);

    useEffect(() => {
        loadProgress();
        // Mark lesson as opened when component mounts
        markLessonOpened();
    }, [lesson.id, loadProgress, markLessonOpened]);

    const markLessonCompleted = async () => {
        setLoading(true);
        try {
            const result = await updateLessonProgress(user.uid, lesson.id, 'completed', courseId);
            if (result.success) {
                setIsCompleted(true);
                setProgress(prev => ({ ...prev, status: 'completed' }));
                if (onComplete) {
                    onComplete(lesson.id);
                }
            } else {
                console.error('Failed to mark lesson as completed:', result.error);
                alert('Failed to mark lesson as completed. Please try again.');
            }
        } catch (error) {
            console.error('Error marking lesson as completed:', error);
            alert('Failed to mark lesson as completed. Please try again.');
        }
        setLoading(false);
    };

    const renderContent = () => {
        switch (lesson.contentType) {
            case 'text':
                return (
                    <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap text-primary-800 dark:text-primary-200">
                            {lesson.content}
                        </div>
                    </div>
                );

            case 'video':
                return (
                    <div className="space-y-4">
                        <div className="bg-primary-100 dark:bg-primary-800 rounded-lg p-4">
                            <p className="text-primary-600 dark:text-primary-400 mb-2">
                                Video URL: {lesson.content}
                            </p>
                            <a
                                href={lesson.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary inline-block"
                            >
                                Watch Video →
                            </a>
                        </div>
                    </div>
                );

            case 'pdf':
                return (
                    <div className="space-y-4">
                        <div className="bg-primary-100 dark:bg-primary-800 rounded-lg p-4">
                            <p className="text-primary-600 dark:text-primary-400 mb-2">
                                PDF Document: {lesson.content}
                            </p>
                            <a
                                href={lesson.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary inline-block"
                            >
                                Open PDF →
                            </a>
                        </div>
                    </div>
                );

            default:
                return <p className="text-primary-600 dark:text-primary-400">Unknown content type</p>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Lesson Header */}
            <div className="border-b border-primary-200 dark:border-primary-700 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                            {lesson.title}
                        </h1>
                        <div className="flex items-center space-x-4 mt-2">
                            <span className="badge badge-info">
                                {lesson.contentType}
                            </span>
                            {progress && (
                                <span className={`badge ${isCompleted ? 'badge-success' : 'badge-warning'}`}>
                                    {isCompleted ? 'Completed' : 'In Progress'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="text-right">
                        <div className="text-sm text-primary-600 dark:text-primary-400">
                            Progress
                        </div>
                        <div className="w-24 bg-primary-200 dark:bg-primary-700 rounded-full h-2 mt-1">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${isCompleted
                                    ? 'bg-green-500 w-full'
                                    : 'bg-primary-600 w-1/2'
                                    }`}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lesson Content */}
            <div className="card">
                <div className="card-body">
                    {renderContent()}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-primary-600 dark:text-primary-400">
                    {progress && (
                        <>
                            Last accessed: {progress.date}
                            {isCompleted && ' • Completed'}
                        </>
                    )}
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className="btn-secondary"
                    >
                        {showNotes ? 'Hide Notes' : 'Study Notes'}
                    </button>

                    {!isCompleted && (
                        <button
                            onClick={markLessonCompleted}
                            disabled={loading}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Marking Complete...' : 'Mark as Complete'}
                        </button>
                    )}

                    {isCompleted && (
                        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium">Lesson Completed!</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Study Notes Section */}
            {showNotes && (
                <div className="mt-6">
                    <StudyNotes
                        user={user}
                        lessonId={lesson.id}
                        lessonTitle={lesson.title}
                        courseTitle={courseId} // You might want to pass the actual course title
                    />
                </div>
            )}
        </div>
    );
};

export default LessonViewer;
