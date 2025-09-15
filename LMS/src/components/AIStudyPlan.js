import React, { useState } from 'react';
import { generateStudyPlan } from '../services/openaiService';
import { saveStudyPlan } from '../firebase/firestore';

const AIStudyPlan = ({ userProfile, user, onClose }) => {
    const [formData, setFormData] = useState({
        goals: '',
        availableTime: '10',
        subjects: []
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [studyPlan, setStudyPlan] = useState(null);
    const [error, setError] = useState('');

    const subjectOptions = [
        'Mathematics', 'Science', 'English', 'History', 'Art', 'Music',
        'Physical Education', 'Computer Science', 'Foreign Language'
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubjectToggle = (subject) => {
        setFormData({
            ...formData,
            subjects: formData.subjects.includes(subject)
                ? formData.subjects.filter(s => s !== subject)
                : [...formData.subjects, subject]
        });
    };

    const handleGenerateStudyPlan = async () => {
        if (!formData.goals.trim()) {
            setError('Please enter your learning goals');
            return;
        }

        if (formData.subjects.length === 0) {
            setError('Please select at least one subject');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await generateStudyPlan(
                formData.goals,
                parseInt(formData.availableTime),
                formData.subjects
            );

            if (result.weeklySchedule) {
                setStudyPlan(result);
            } else {
                setError('Failed to generate study plan. Please try again.');
            }
        } catch (error) {
            console.error('AI Study Plan Error:', error);
            setError('AI service unavailable. Please try again later.');
        }

        setLoading(false);
    };

    const handleSaveStudyPlan = async () => {
        if (!studyPlan) return;

        setSaving(true);
        setError('');

        try {
            // Convert study plan to tasks format
            const tasks = [];

            // Add weekly schedule tasks
            Object.entries(studyPlan.weeklySchedule).forEach(([day, subjects]) => {
                subjects.forEach(subject => {
                    tasks.push({
                        id: Date.now().toString() + Math.random(),
                        title: `${subject} Study`,
                        description: `Study ${subject} on ${day}`,
                        day: day,
                        subject: subject,
                        completed: false,
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
                    });
                });
            });

            // Add priority tasks
            if (studyPlan.priorities) {
                studyPlan.priorities.forEach((priority, index) => {
                    tasks.push({
                        id: Date.now().toString() + Math.random() + index,
                        title: priority,
                        description: `Priority task: ${priority}`,
                        day: 'any',
                        subject: 'general',
                        completed: false,
                        dueDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString() // Staggered deadlines
                    });
                });
            }

            const planData = {
                studentId: user.uid,
                planTitle: `AI Study Plan - ${formData.goals.substring(0, 50)}...`,
                goals: formData.goals,
                availableTime: formData.availableTime,
                subjects: formData.subjects,
                tasks: tasks,
                weeklySchedule: studyPlan.weeklySchedule,
                priorities: studyPlan.priorities,
                breakRecommendations: studyPlan.breakRecommendations,
                milestones: studyPlan.milestones,
                aiGenerated: true
            };

            console.log('Saving study plan:', planData);
            const result = await saveStudyPlan(planData);
            console.log('Save result:', result);

            if (result.success) {
                alert('Study plan saved successfully!');
                onClose();
            } else {
                console.error('Save failed:', result.error);
                setError('Failed to save study plan: ' + result.error);
            }
        } catch (error) {
            console.error('Save Study Plan Error:', error);
            setError('Failed to save study plan. Please try again.');
        }

        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-primary-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">
                            🤖 AI Study Plan Generator
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {!studyPlan ? (
                        <form className="space-y-6">
                            <div>
                                <label htmlFor="goals" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                    Learning Goals *
                                </label>
                                <textarea
                                    id="goals"
                                    name="goals"
                                    rows={4}
                                    required
                                    className="input-field"
                                    placeholder="Describe your learning goals... (e.g., Improve math skills, prepare for science test, learn new vocabulary)"
                                    value={formData.goals}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="availableTime" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                    Available Study Time (hours per week)
                                </label>
                                <select
                                    id="availableTime"
                                    name="availableTime"
                                    className="input-field"
                                    value={formData.availableTime}
                                    onChange={handleChange}
                                >
                                    <option value="5">5 hours</option>
                                    <option value="10">10 hours</option>
                                    <option value="15">15 hours</option>
                                    <option value="20">20 hours</option>
                                    <option value="25">25 hours</option>
                                    <option value="30">30+ hours</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                    Subjects to Focus On *
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {subjectOptions.map((subject) => (
                                        <label key={subject} className="flex items-center space-x-2 p-2 border border-primary-200 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.subjects.includes(subject)}
                                                onChange={() => handleSubjectToggle(subject)}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-primary-800 dark:text-primary-200">{subject}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-700 rounded-lg">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-blue-800 dark:text-blue-200">AI-Powered Study Planning</h3>
                                        <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                                            Our AI will create a personalized study schedule based on your goals, available time, and subjects.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateStudyPlan}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Generating Plan...
                                        </div>
                                    ) : (
                                        '🤖 Generate AI Study Plan'
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                                    Your Personalized Study Plan
                                </h3>
                                <span className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm px-3 py-1 rounded-full">
                                    AI Generated
                                </span>
                            </div>

                            {/* Weekly Schedule */}
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="text-lg font-semibold text-primary-800 dark:text-primary-200">Weekly Schedule</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(studyPlan.weeklySchedule).map(([day, subjects]) => (
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

                            {/* Priorities */}
                            {studyPlan.priorities && (
                                <div className="card">
                                    <div className="card-header">
                                        <h4 className="text-lg font-semibold text-primary-800 dark:text-primary-200">Study Priorities</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {studyPlan.priorities.map((priority, index) => (
                                            <div key={index} className="flex items-center space-x-3">
                                                <span className="bg-primary-100 dark:bg-primary-700 text-primary-600 dark:text-primary-400 text-sm font-medium px-2 py-1 rounded">
                                                    {index + 1}
                                                </span>
                                                <span className="text-primary-800 dark:text-primary-200">{priority}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Break Recommendations */}
                            {studyPlan.breakRecommendations && (
                                <div className="card">
                                    <div className="card-header">
                                        <h4 className="text-lg font-semibold text-primary-800 dark:text-primary-200">Break Recommendations</h4>
                                    </div>
                                    <p className="text-primary-600 dark:text-primary-400">{studyPlan.breakRecommendations}</p>
                                </div>
                            )}

                            {/* Milestones */}
                            {studyPlan.milestones && (
                                <div className="card">
                                    <div className="card-header">
                                        <h4 className="text-lg font-semibold text-primary-800 dark:text-primary-200">Progress Milestones</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {studyPlan.milestones.map((milestone, index) => (
                                            <div key={index} className="flex items-center space-x-3">
                                                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm">
                                                    ✓
                                                </div>
                                                <span className="text-primary-800 dark:text-primary-200">{milestone}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setStudyPlan(null)}
                                    className="btn-secondary"
                                >
                                    Generate New Plan
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveStudyPlan}
                                    disabled={saving}
                                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIStudyPlan;
