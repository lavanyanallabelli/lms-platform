import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuiz, saveQuizResult, updateUserProgress, getResources } from '../firebase/firestore';
import { autoGradeQuestion, generateRecommendations } from '../utils/aiRecommendations';
import StudyNotes from '../components/StudyNotes';
import LoadingSpinner from '../components/LoadingSpinner';

const QuizTaking = ({ user, userProfile }) => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [quizResults, setQuizResults] = useState(null);
    // const [recommendations, setRecommendations] = useState([]);
    const [showNotes, setShowNotes] = useState(false);
    const [error, setError] = useState('');

    const loadQuiz = useCallback(async () => {
        setLoading(true);
        const result = await getQuiz(quizId);
        if (result.success) {
            setQuiz(result.data);
            // Initialize answers object
            const initialAnswers = {};
            result.data.questions.forEach(question => {
                initialAnswers[question.id] = '';
            });
            setAnswers(initialAnswers);
        } else {
            setError(result.error);
        }
        setLoading(false);
    }, [quizId]);

    useEffect(() => {
        // Check if user is a student - only students can take quizzes
        if (userProfile?.role === 'teacher') {
            setError('Teachers cannot take quizzes. Use the preview mode from the course page.');
            setLoading(false);
            return;
        }
        loadQuiz();
    }, [quizId, userProfile, loadQuiz]);

    const handleAnswerChange = (questionId, answer) => {
        setAnswers({
            ...answers,
            [questionId]: answer
        });
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        setSubmitting(true);

        // Grade all questions using AI
        const gradedQuestions = await Promise.all(quiz.questions.map(async (question) => {
            const studentAnswer = answers[question.id];
            const grading = await autoGradeQuestion(question, studentAnswer);
            return {
                ...question,
                studentAnswer,
                score: grading.score,
                feedback: grading.feedback,
                strengths: grading.strengths,
                improvements: grading.improvements
            };
        }));

        // Calculate total score
        const totalScore = gradedQuestions.reduce((sum, q) => sum + q.score, 0);
        const averageScore = Math.round(totalScore / gradedQuestions.length);

        // Generate AI recommendations
        const resourcesResult = await getResources();
        const availableResources = resourcesResult.success ? resourcesResult.data : [];
        const aiRecommendations = await generateRecommendations(
            averageScore,
            quiz.subject || 'general', // Use quiz subject if available
            answers, // Pass student answers for AI analysis
            quiz.title, // Pass course content for context
            availableResources
        );

        // Save quiz result with detailed timestamp
        const now = new Date();
        const resultData = {
            studentId: user.uid,
            quizId: quizId,
            courseId: quiz.courseId,
            score: averageScore,
            totalQuestions: quiz.questions.length,
            questions: gradedQuestions,
            submittedAt: now.toISOString(),
            timestamp: now.getTime(), // Unix timestamp for sorting
            date: now.toLocaleDateString(), // Human readable date
            time: now.toLocaleTimeString(), // Human readable time
            recommendations: aiRecommendations.map(rec => rec.title)
        };

        console.log('Attempting to save quiz result:', resultData);
        const saveResult = await saveQuizResult(resultData);
        console.log('Save result:', saveResult);

        if (saveResult.success) {
            // Update user progress with quiz score
            await updateUserProgress(user.uid, quiz.courseId, {
                quizScores: [...(userProfile.progress?.[quiz.courseId]?.quizScores || []), averageScore]
            });

            setQuizResults({
                score: averageScore,
                totalQuestions: quiz.questions.length,
                questions: gradedQuestions,
                recommendations: aiRecommendations
            });
            setShowResults(true);
        } else {
            setError(saveResult.error);
        }

        setSubmitting(false);
    };

    const renderQuestion = (question) => {
        const currentAnswer = answers[question.id] || '';

        switch (question.type) {
            case 'mcq':
                return (
                    <div className="space-y-3">
                        {question.options.map((option, index) => (
                            <label key={index} className="flex items-center space-x-3 p-3 border border-primary-200 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-800 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    value={String.fromCharCode(65 + index)}
                                    checked={currentAnswer === String.fromCharCode(65 + index)}
                                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                    className="text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-primary-800 dark:text-primary-200">
                                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                                </span>
                            </label>
                        ))}
                    </div>
                );

            case 'truefalse':
                return (
                    <div className="space-y-3">
                        <label className="flex items-center space-x-3 p-3 border border-primary-200 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-800 cursor-pointer">
                            <input
                                type="radio"
                                name={`question-${question.id}`}
                                value="true"
                                checked={currentAnswer === 'true'}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-primary-800 dark:text-primary-200">True</span>
                        </label>
                        <label className="flex items-center space-x-3 p-3 border border-primary-200 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-800 cursor-pointer">
                            <input
                                type="radio"
                                name={`question-${question.id}`}
                                value="false"
                                checked={currentAnswer === 'false'}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-primary-800 dark:text-primary-200">False</span>
                        </label>
                    </div>
                );

            case 'short':
                return (
                    <div>
                        <textarea
                            value={currentAnswer}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            rows={4}
                            className="input-field"
                            placeholder="Enter your answer here..."
                        />
                    </div>
                );

            default:
                return <p className="text-red-600 dark:text-red-400">Unknown question type</p>;
        }
    };

    const renderResults = () => {
        if (!quizResults) return null;

        return (
            <div className="space-y-6">
                {/* Score Summary */}
                <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${quizResults.score >= 80 ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                        quizResults.score >= 60 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        {quizResults.score}%
                    </div>
                    <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-200 mt-4">
                        {quizResults.score >= 80 ? 'Excellent!' :
                            quizResults.score >= 60 ? 'Good Job!' : 'Keep Learning!'}
                    </h2>
                    <p className="text-primary-600 dark:text-primary-400 mt-2">
                        You scored {quizResults.score}% on {quizResults.totalQuestions} questions
                    </p>
                </div>

                {/* Question Review */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">Question Review</h3>
                    </div>
                    <div className="space-y-4">
                        {quizResults.questions.map((question, index) => (
                            <div key={question.id} className="border border-primary-200 dark:border-primary-700 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-medium text-primary-800 dark:text-primary-200">
                                        Question {index + 1}
                                    </h4>
                                    <span className={`badge ${question.score >= 80 ? 'badge-success' :
                                        question.score >= 60 ? 'badge-warning' :
                                            'badge-danger'
                                        }`}>
                                        {question.score}%
                                    </span>
                                </div>
                                <p className="text-primary-700 dark:text-primary-300 mb-3">{question.question}</p>
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        <span className="font-medium text-primary-600 dark:text-primary-400">Your answer:</span>
                                        <span className="ml-2 text-primary-800 dark:text-primary-200">{question.studentAnswer}</span>
                                    </p>
                                    {question.type === 'mcq' && (
                                        <p className="text-sm">
                                            <span className="font-medium text-primary-600 dark:text-primary-400">Correct answer:</span>
                                            <span className="ml-2 text-primary-800 dark:text-primary-200">{question.answer}</span>
                                        </p>
                                    )}
                                    <div className="space-y-2">
                                        <p className="text-sm">
                                            <span className="font-medium text-primary-600 dark:text-primary-400">Feedback:</span>
                                            <span className="ml-2 text-primary-800 dark:text-primary-200">{question.feedback}</span>
                                        </p>
                                        {question.strengths && (
                                            <p className="text-sm">
                                                <span className="font-medium text-green-600 dark:text-green-400">Strengths:</span>
                                                <span className="ml-2 text-primary-800 dark:text-primary-200">{question.strengths}</span>
                                            </p>
                                        )}
                                        {question.improvements && (
                                            <p className="text-sm">
                                                <span className="font-medium text-blue-600 dark:text-blue-400">Improvements:</span>
                                                <span className="ml-2 text-primary-800 dark:text-primary-200">{question.improvements}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Recommendations */}
                {quizResults.recommendations.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">AI Recommendations</h3>
                            <p className="text-primary-600 dark:text-primary-400 text-sm mt-1">
                                Personalized suggestions based on your performance
                            </p>
                        </div>
                        <div className="space-y-3">
                            {quizResults.recommendations.map((rec, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 border border-primary-200 dark:border-primary-700 rounded-lg">
                                    <div className={`p-2 rounded-lg ${rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/20' :
                                        rec.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                                            'bg-green-100 dark:bg-green-900/20'
                                        }`}>
                                        <svg className={`w-5 h-5 ${rec.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                                            rec.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                                'text-green-600 dark:text-green-400'
                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-medium text-primary-800 dark:text-primary-200">{rec.title}</h4>
                                            {rec.aiGenerated && (
                                                <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
                                                    AI Generated
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">{rec.description}</p>
                                        {rec.url && (
                                            <a
                                                href={rec.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 text-sm mt-2 inline-block"
                                            >
                                                View Resource →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className="btn-secondary"
                    >
                        {showNotes ? 'Hide Notes' : 'Study Notes'}
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-primary"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => navigate(`/course/${quiz.courseId}`)}
                        className="btn-secondary"
                    >
                        Continue Learning
                    </button>
                </div>

                {/* Study Notes Section */}
                {showNotes && (
                    <div className="mt-6">
                        <StudyNotes
                            user={user}
                            quizId={quizId}
                            lessonTitle={`Quiz: ${quiz.title}`}
                            courseTitle={quiz.courseId}
                        />
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-200">Error</h2>
                <p className="text-primary-600 dark:text-primary-400 mt-2">{error}</p>
                <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-200">Quiz not found</h2>
                <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (showResults) {
        return (
            <div className="max-w-4xl mx-auto">
                {renderResults()}
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Quiz Header */}
            <div className="card mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-primary-800 dark:text-primary-200">{quiz.title}</h1>
                        {quiz.description && (
                            <p className="text-primary-600 dark:text-primary-400 mt-1">{quiz.description}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-primary-600 dark:text-primary-400">
                            Question {currentQuestionIndex + 1} of {quiz.questions.length}
                        </p>
                        <div className="w-32 bg-primary-200 dark:bg-primary-700 rounded-full h-2 mt-2">
                            <div
                                className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Question */}
            <div className="card">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200 mb-4">
                        {currentQuestion.question}
                    </h2>
                    {renderQuestion(currentQuestion)}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-6 border-t border-primary-200 dark:border-primary-700">
                    <button
                        onClick={handlePreviousQuestion}
                        disabled={isFirstQuestion}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <div className="flex space-x-2">
                        {quiz.questions.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestionIndex(index)}
                                className={`w-8 h-8 rounded-full text-sm font-medium ${index === currentQuestionIndex
                                    ? 'bg-primary-600 text-white'
                                    : answers[quiz.questions[index].id]
                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                        : 'bg-primary-100 text-primary-600 dark:bg-primary-700 dark:text-primary-400'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    {isLastQuestion ? (
                        <button
                            onClick={handleSubmitQuiz}
                            disabled={submitting}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                    ) : (
                        <button
                            onClick={handleNextQuestion}
                            className="btn-primary"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizTaking;
