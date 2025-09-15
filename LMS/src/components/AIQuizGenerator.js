import React, { useState } from 'react';
import { generateQuizQuestions } from '../services/openaiService';

const AIQuizGenerator = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        topic: '',
        subject: 'math',
        difficulty: 'medium',
        numberOfQuestions: 5
    });
    const [loading, setLoading] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState(null);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleGenerateQuestions = async () => {
        if (!formData.topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await generateQuizQuestions(
                formData.topic,
                formData.subject,
                formData.difficulty,
                parseInt(formData.numberOfQuestions)
            );

            if (result.questions) {
                setGeneratedQuestions(result.questions);
            } else {
                setError('Failed to generate questions. Please try again.');
            }
        } catch (error) {
            console.error('AI Quiz Generation Error:', error);
            setError('AI service unavailable. Please try again later.');
        }

        setLoading(false);
    };

    const handleUseGeneratedQuestions = () => {
        if (generatedQuestions) {
            onSubmit({
                title: `AI Generated Quiz: ${formData.topic}`,
                description: `AI-generated quiz about ${formData.topic} (${formData.difficulty} difficulty)`,
                questions: generatedQuestions.map((q, index) => ({
                    id: `ai-q-${index}`,
                    type: q.type,
                    question: q.question,
                    options: q.options || [],
                    answer: q.answer,
                    explanation: q.explanation
                }))
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-primary-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200 mb-4">
                        AI Quiz Generator
                    </h2>

                    {!generatedQuestions ? (
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="topic" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                        Topic *
                                    </label>
                                    <input
                                        type="text"
                                        id="topic"
                                        name="topic"
                                        required
                                        className="input-field"
                                        placeholder="e.g., Photosynthesis, Algebra Basics, World War II"
                                        value={formData.topic}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                        Subject
                                    </label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        className="input-field"
                                        value={formData.subject}
                                        onChange={handleChange}
                                    >
                                        <option value="math">Mathematics</option>
                                        <option value="science">Science</option>
                                        <option value="english">English</option>
                                        <option value="history">History</option>
                                        <option value="art">Art</option>
                                        <option value="music">Music</option>
                                        <option value="physical-education">Physical Education</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="difficulty" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                        Difficulty
                                    </label>
                                    <select
                                        id="difficulty"
                                        name="difficulty"
                                        className="input-field"
                                        value={formData.difficulty}
                                        onChange={handleChange}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="numberOfQuestions" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                        Number of Questions
                                    </label>
                                    <select
                                        id="numberOfQuestions"
                                        name="numberOfQuestions"
                                        className="input-field"
                                        value={formData.numberOfQuestions}
                                        onChange={handleChange}
                                    >
                                        <option value="3">3 Questions</option>
                                        <option value="5">5 Questions</option>
                                        <option value="7">7 Questions</option>
                                        <option value="10">10 Questions</option>
                                    </select>
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
                                        <h3 className="font-medium text-blue-800 dark:text-blue-200">AI-Powered Quiz Generation</h3>
                                        <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                                            Our AI will create a comprehensive quiz with multiple question types based on your topic and difficulty level.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateQuestions}
                                    disabled={loading}
                                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Generating...
                                        </div>
                                    ) : (
                                        'Generate Quiz with AI'
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                                    Generated Questions ({generatedQuestions.length})
                                </h3>
                                <span className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm px-3 py-1 rounded-full">
                                    AI Generated
                                </span>
                            </div>

                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {generatedQuestions.map((question, index) => (
                                    <div key={index} className="border border-primary-200 dark:border-primary-700 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                <span className="bg-primary-100 dark:bg-primary-700 text-primary-600 dark:text-primary-400 text-sm font-medium px-2 py-1 rounded">
                                                    Q{index + 1}
                                                </span>
                                                <span className="badge badge-info">
                                                    {question.type === 'mcq' ? 'Multiple Choice' :
                                                        question.type === 'truefalse' ? 'True/False' : 'Short Answer'}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-primary-800 dark:text-primary-200 mb-3">{question.question}</p>

                                        {question.options && question.options.length > 0 && (
                                            <div className="text-sm text-primary-600 dark:text-primary-400 mb-2">
                                                <p className="font-medium">Options:</p>
                                                <ul className="list-disc list-inside ml-4">
                                                    {question.options.map((option, optIndex) => (
                                                        <li key={optIndex}>{option}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="text-sm text-primary-600 dark:text-primary-400">
                                            <p><span className="font-medium">Correct Answer:</span> {question.answer}</p>
                                            {question.explanation && (
                                                <p className="mt-1"><span className="font-medium">Explanation:</span> {question.explanation}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setGeneratedQuestions(null)}
                                    className="btn-secondary"
                                >
                                    Generate New Quiz
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUseGeneratedQuestions}
                                    className="btn-primary"
                                >
                                    Use These Questions
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIQuizGenerator;
