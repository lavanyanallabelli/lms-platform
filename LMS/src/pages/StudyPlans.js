import React, { useState, useEffect, useCallback } from 'react';
import { getStudyPlans, updateStudyPlan, deleteStudyPlan } from '../firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

const StudyPlans = ({ user, userProfile }) => {
    const [studyPlans, setStudyPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);

    const loadStudyPlans = useCallback(async () => {
        setLoading(true);
        const result = await getStudyPlans(user.uid);
        if (result.success) {
            setStudyPlans(result.data);
        } else {
            setError(result.error);
        }
        setLoading(false);
    }, [user.uid]);

    useEffect(() => {
        loadStudyPlans();
    }, [loadStudyPlans]);

    const handleTaskToggle = async (planId, taskId) => {
        const plan = studyPlans.find(p => p.id === planId);
        if (!plan) return;

        const updatedTasks = plan.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );

        // Update local state immediately for instant feedback
        setStudyPlans(prev => prev.map(p =>
            p.id === planId ? { ...p, tasks: updatedTasks } : p
        ));

        // Update in database
        const result = await updateStudyPlan(planId, { tasks: updatedTasks });
        if (!result.success) {
            // Revert the change if database update failed
            setStudyPlans(prev => prev.map(p =>
                p.id === planId ? { ...p, tasks: plan.tasks } : p
            ));
            setError(result.error);
        }
    };

    const handleDeletePlan = async (planId) => {
        if (window.confirm('Are you sure you want to delete this study plan?')) {
            const result = await deleteStudyPlan(planId);
            if (result.success) {
                setStudyPlans(prev => prev.filter(p => p.id !== planId));
            } else {
                setError(result.error);
            }
        }
    };

    const getTaskProgress = (tasks) => {
        const completed = tasks.filter(task => task.completed).length;
        const total = tasks.length;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    const getUpcomingTasks = (tasks) => {
        const now = new Date();
        const upcoming = tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            return !task.completed && dueDate > now;
        });
        return upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
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
                        My Study Plans
                    </h1>
                    <p className="text-primary-600 dark:text-primary-400 mt-2">
                        Manage your saved study plans and track your progress.
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Study Plans List */}
            {studyPlans.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-primary-800 dark:text-primary-200">No study plans</h3>
                    <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
                        Create your first study plan from the dashboard.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {studyPlans.map((plan) => {
                        const progress = getTaskProgress(plan.tasks);
                        const upcomingTasks = getUpcomingTasks(plan.tasks);

                        return (
                            <div key={plan.id} className="card relative">
                                <div
                                    className="cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800/50 transition-colors"
                                    onClick={() => setSelectedPlan(plan)}
                                >
                                    <div className="card-header">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                                                    {plan.planTitle}
                                                </h3>
                                                <p className="text-primary-600 dark:text-primary-400 text-sm mt-1">
                                                    {plan.goals}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-body">
                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm text-primary-600 dark:text-primary-400 mb-1">
                                                <span>Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="w-full bg-primary-200 dark:bg-primary-700 rounded-full h-2">
                                                <div
                                                    className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Quick Stats */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                                                    {plan.tasks.filter(t => t.completed).length}
                                                </div>
                                                <div className="text-sm text-primary-600 dark:text-primary-400">
                                                    Completed
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                                                    {upcomingTasks.length}
                                                </div>
                                                <div className="text-sm text-primary-600 dark:text-primary-400">
                                                    Upcoming
                                                </div>
                                            </div>
                                        </div>

                                        {/* Next Task */}
                                        {upcomingTasks.length > 0 && (
                                            <div className="bg-primary-50 dark:bg-primary-800 rounded-lg p-3">
                                                <h4 className="font-medium text-primary-800 dark:text-primary-200 mb-1">
                                                    Next Task
                                                </h4>
                                                <p className="text-sm text-primary-600 dark:text-primary-400">
                                                    {upcomingTasks[0].title}
                                                </p>
                                                <p className="text-xs text-primary-500 dark:text-primary-500 mt-1">
                                                    Due: {new Date(upcomingTasks[0].dueDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}

                                        {/* AI Generated Badge */}
                                        {plan.aiGenerated && (
                                            <div className="mt-3">
                                                <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full">

                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Delete Button - Outside clickable area */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePlan(plan.id);
                                    }}
                                    className="absolute top-4 right-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 bg-white dark:bg-primary-800 rounded-full p-1 shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Study Plan Detail Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-primary-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">
                                    {selectedPlan.planTitle}
                                </h2>
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Goals */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-2">
                                    Goals
                                </h3>
                                <p className="text-primary-600 dark:text-primary-400">{selectedPlan.goals}</p>
                            </div>

                            {/* Tasks */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-4">
                                    Tasks ({selectedPlan.tasks.length})
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {selectedPlan.tasks.map((task) => (
                                        <div key={task.id} className="flex items-center space-x-3 p-3 border border-primary-200 dark:border-primary-700 rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => handleTaskToggle(selectedPlan.id, task.id)}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <div className="flex-1">
                                                <h4 className={`font-medium ${task.completed ? 'line-through text-primary-500' : 'text-primary-800 dark:text-primary-200'}`}>
                                                    {task.title}
                                                </h4>
                                                <p className="text-sm text-primary-600 dark:text-primary-400">
                                                    {task.description}
                                                </p>
                                                <p className="text-xs text-primary-500 dark:text-primary-500">
                                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Weekly Schedule */}
                            {selectedPlan.weeklySchedule && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-4">
                                        Weekly Schedule
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(selectedPlan.weeklySchedule).map(([day, subjects]) => (
                                            <div key={day} className="border border-primary-200 dark:border-primary-700 rounded-lg p-4">
                                                <h5 className="font-medium text-primary-800 dark:text-primary-200 mb-2 capitalize">
                                                    {day}
                                                </h5>
                                                <div className="space-y-1">
                                                    {subjects.map((subject, index) => (
                                                        <span key={index} className="inline-block bg-primary-100 dark:bg-primary-700 text-primary-600 dark:text-primary-400 text-xs px-2 py-1 rounded mr-1 mb-1">
                                                            {subject}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyPlans;
