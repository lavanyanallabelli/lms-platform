import React, { useState } from 'react';

const QuizForm = ({ onSubmit, onCancel, initialData = null }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        questions: initialData?.questions || []
    });

    const [currentQuestion, setCurrentQuestion] = useState({
        type: 'mcq',
        question: '',
        options: ['', '', '', ''],
        answer: '',
        keywords: []
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleQuestionChange = (e) => {
        setCurrentQuestion({
            ...currentQuestion,
            [e.target.name]: e.target.value
        });
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...currentQuestion.options];
        newOptions[index] = value;
        setCurrentQuestion({
            ...currentQuestion,
            options: newOptions
        });
    };

    const addQuestion = () => {
        if (!currentQuestion.question.trim()) return;

        const question = {
            id: Date.now().toString(),
            type: currentQuestion.type,
            question: currentQuestion.question,
            answer: currentQuestion.answer,
            options: currentQuestion.type === 'mcq' ? currentQuestion.options.filter(opt => opt.trim()) : [],
            keywords: currentQuestion.type === 'short' ? currentQuestion.keywords : []
        };

        setFormData({
            ...formData,
            questions: [...formData.questions, question]
        });

        // Reset form
        setCurrentQuestion({
            type: 'mcq',
            question: '',
            options: ['', '', '', ''],
            answer: '',
            keywords: []
        });
    };

    const removeQuestion = (questionId) => {
        setFormData({
            ...formData,
            questions: formData.questions.filter(q => q.id !== questionId)
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.questions.length === 0) {
            alert('Please add at least one question');
            return;
        }
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-primary-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200 mb-4">
                        {initialData ? 'Edit Quiz' : 'Create New Quiz'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Quiz Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                    Quiz Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    required
                                    className="input-field"
                                    placeholder="Enter quiz title"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    id="description"
                                    name="description"
                                    className="input-field"
                                    placeholder="Enter quiz description"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Add Question Form */}
                        <div className="border border-primary-200 dark:border-primary-700 rounded-lg p-4">
                            <h3 className="text-lg font-medium text-primary-800 dark:text-primary-200 mb-4">Add Question</h3>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="questionType" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                        Question Type
                                    </label>
                                    <select
                                        id="questionType"
                                        name="type"
                                        className="input-field"
                                        value={currentQuestion.type}
                                        onChange={handleQuestionChange}
                                    >
                                        <option value="mcq">Multiple Choice</option>
                                        <option value="truefalse">True/False</option>
                                        <option value="short">Short Answer</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="question" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                        Question
                                    </label>
                                    <textarea
                                        id="question"
                                        name="question"
                                        rows={3}
                                        required
                                        className="input-field"
                                        placeholder="Enter your question"
                                        value={currentQuestion.question}
                                        onChange={handleQuestionChange}
                                    />
                                </div>

                                {currentQuestion.type === 'mcq' && (
                                    <div>
                                        <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                            Options
                                        </label>
                                        <div className="space-y-2">
                                            {currentQuestion.options.map((option, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400 w-6">
                                                        {String.fromCharCode(65 + index)}.
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="input-field flex-1"
                                                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                                        value={option}
                                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2">
                                            <label htmlFor="correctAnswer" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                                Correct Answer
                                            </label>
                                            <select
                                                id="correctAnswer"
                                                name="answer"
                                                className="input-field"
                                                value={currentQuestion.answer}
                                                onChange={handleQuestionChange}
                                            >
                                                <option value="">Select correct answer</option>
                                                {currentQuestion.options.map((option, index) => (
                                                    <option key={index} value={String.fromCharCode(65 + index)}>
                                                        {String.fromCharCode(65 + index)}. {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {currentQuestion.type === 'truefalse' && (
                                    <div>
                                        <label htmlFor="correctAnswer" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                            Correct Answer
                                        </label>
                                        <select
                                            id="correctAnswer"
                                            name="answer"
                                            className="input-field"
                                            value={currentQuestion.answer}
                                            onChange={handleQuestionChange}
                                        >
                                            <option value="">Select correct answer</option>
                                            <option value="true">True</option>
                                            <option value="false">False</option>
                                        </select>
                                    </div>
                                )}

                                {currentQuestion.type === 'short' && (
                                    <div>
                                        <label htmlFor="correctAnswer" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                            Expected Answer
                                        </label>
                                        <textarea
                                            id="correctAnswer"
                                            name="answer"
                                            rows={2}
                                            className="input-field"
                                            placeholder="Enter the expected answer"
                                            value={currentQuestion.answer}
                                            onChange={handleQuestionChange}
                                        />
                                        <p className="text-xs text-primary-500 dark:text-primary-500 mt-1">
                                            The AI will grade based on keyword matching and text similarity.
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="btn-primary"
                                >
                                    Add Question
                                </button>
                            </div>
                        </div>

                        {/* Questions List */}
                        {formData.questions.length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium text-primary-800 dark:text-primary-200 mb-4">
                                    Questions ({formData.questions.length})
                                </h3>
                                <div className="space-y-3">
                                    {formData.questions.map((question, index) => (
                                        <div key={question.id} className="border border-primary-200 dark:border-primary-700 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className="bg-primary-100 dark:bg-primary-700 text-primary-600 dark:text-primary-400 text-sm font-medium px-2 py-1 rounded">
                                                            Q{index + 1}
                                                        </span>
                                                        <span className="badge badge-info">
                                                            {question.type === 'mcq' ? 'Multiple Choice' :
                                                                question.type === 'truefalse' ? 'True/False' : 'Short Answer'}
                                                        </span>
                                                    </div>
                                                    <p className="text-primary-800 dark:text-primary-200 mb-2">{question.question}</p>
                                                    {question.type === 'mcq' && (
                                                        <div className="text-sm text-primary-600 dark:text-primary-400">
                                                            <p>Options: {question.options.join(', ')}</p>
                                                            <p>Correct: {question.answer}</p>
                                                        </div>
                                                    )}
                                                    {question.type === 'truefalse' && (
                                                        <p className="text-sm text-primary-600 dark:text-primary-400">
                                                            Correct Answer: {question.answer}
                                                        </p>
                                                    )}
                                                    {question.type === 'short' && (
                                                        <p className="text-sm text-primary-600 dark:text-primary-400">
                                                            Expected: {question.answer}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(question.id)}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 ml-4"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={formData.questions.length === 0}
                            >
                                {initialData ? 'Update Quiz' : 'Create Quiz'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default QuizForm;
