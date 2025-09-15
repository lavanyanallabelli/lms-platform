// AI Recommendation System for Personalized Learning Paths
import { gradeAnswerWithAI, generatePersonalizedRecommendations } from '../services/openaiService';

// AI-Powered Short Answer Grading
export const gradeShortAnswer = async (studentAnswer, correctAnswer, question) => {
    try {
        // Use OpenAI for intelligent grading
        const aiGrading = await gradeAnswerWithAI(question, studentAnswer, correctAnswer);
        return {
            score: aiGrading.score,
            feedback: aiGrading.feedback,
            strengths: aiGrading.strengths,
            improvements: aiGrading.improvements
        };
    } catch (error) {
        console.error('AI Grading Error:', error);
        // Fallback to rule-based grading
        return fallbackGrading(studentAnswer, correctAnswer);
    }
};

// Fallback rule-based grading
const fallbackGrading = (studentAnswer, correctAnswer) => {
    const studentText = studentAnswer.toLowerCase();
    const correctText = correctAnswer.toLowerCase();

    // Check for exact match first
    if (studentText === correctText) {
        return {
            score: 100,
            feedback: "Perfect answer!",
            strengths: "Excellent understanding of the concept.",
            improvements: "Keep up the great work!"
        };
    }

    // Check for partial text similarity
    const similarity = calculateTextSimilarity(studentText, correctText);
    const similarityScore = similarity * 100;

    let feedback = "";
    let strengths = "";
    let improvements = "";

    if (similarityScore >= 80) {
        feedback = "Great answer! You covered most of the key points.";
        strengths = "Good understanding of the main concepts.";
        improvements = "Consider adding more specific details.";
    } else if (similarityScore >= 60) {
        feedback = "Good attempt! Consider including more key concepts.";
        strengths = "You're on the right track.";
        improvements = "Review the lesson material for more details.";
    } else if (similarityScore >= 40) {
        feedback = "You're on the right track. Review the material and try again.";
        strengths = "You attempted to answer the question.";
        improvements = "Please review the lesson material thoroughly.";
    } else {
        feedback = "Please review the lesson material and try again.";
        strengths = "You submitted an answer.";
        improvements = "Study the lesson content and try again.";
    }

    return {
        score: Math.round(similarityScore),
        feedback,
        strengths,
        improvements
    };
};

// Simple text similarity calculation
const calculateTextSimilarity = (text1, text2) => {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
};

// AI-Powered Personalized Learning Recommendations
export const generateRecommendations = async (quizScore, subject, studentAnswers, courseContent, availableResources) => {
    try {
        // Use OpenAI for intelligent recommendations
        const aiRecommendations = await generatePersonalizedRecommendations(
            quizScore,
            subject,
            studentAnswers,
            courseContent
        );

        // Convert AI response to our format
        const recommendations = [];

        // Add learning path recommendation
        recommendations.push({
            type: aiRecommendations.learningPath,
            title: `Learning Path: ${aiRecommendations.learningPath.charAt(0).toUpperCase() + aiRecommendations.learningPath.slice(1)}`,
            description: aiRecommendations.motivationalMessage,
            priority: 'high',
            aiGenerated: true
        });

        // Add study suggestions
        aiRecommendations.studySuggestions.forEach((suggestion, index) => {
            recommendations.push({
                type: 'study',
                title: `Study Tip ${index + 1}`,
                description: suggestion,
                priority: 'medium',
                aiGenerated: true
            });
        });

        // Add recommended resources
        aiRecommendations.recommendedResources.forEach((resource, index) => {
            recommendations.push({
                type: 'resource',
                title: resource,
                description: `AI-recommended resource for ${subject}`,
                priority: 'medium',
                aiGenerated: true
            });
        });

        // Add next steps
        recommendations.push({
            type: 'next',
            title: 'Next Steps',
            description: aiRecommendations.nextSteps,
            priority: 'high',
            aiGenerated: true
        });

        return recommendations;
    } catch (error) {
        console.error('AI Recommendations Error:', error);
        // Fallback to rule-based recommendations
        return fallbackRecommendations(quizScore, subject, availableResources);
    }
};

// Fallback rule-based recommendations
const fallbackRecommendations = (quizScore, subject, availableResources) => {
    const recommendations = [];

    // Determine performance level
    let performanceLevel = 'excellent';
    let nextDifficulty = 'hard';

    if (quizScore < 50) {
        performanceLevel = 'needs_improvement';
        nextDifficulty = 'easy';
    } else if (quizScore < 70) {
        performanceLevel = 'good';
        nextDifficulty = 'medium';
    } else if (quizScore < 85) {
        performanceLevel = 'very_good';
        nextDifficulty = 'medium';
    }

    // Filter resources based on performance
    const relevantResources = availableResources.filter(resource => {
        return resource.subject === subject &&
            (resource.difficulty === nextDifficulty ||
                (performanceLevel === 'needs_improvement' && resource.difficulty === 'easy'));
    });

    // Add specific recommendations based on performance
    if (performanceLevel === 'needs_improvement') {
        recommendations.push({
            type: 'remedial',
            title: 'Review Basic Concepts',
            description: 'Focus on fundamental concepts before moving forward',
            priority: 'high',
            aiGenerated: false
        });
    } else if (performanceLevel === 'good') {
        recommendations.push({
            type: 'practice',
            title: 'Practice More Problems',
            description: 'Try additional practice problems to strengthen your understanding',
            priority: 'medium',
            aiGenerated: false
        });
    } else {
        recommendations.push({
            type: 'advanced',
            title: 'Challenge Yourself',
            description: 'You\'re ready for more advanced topics!',
            priority: 'low',
            aiGenerated: false
        });
    }

    // Add specific resources
    relevantResources.slice(0, 3).forEach(resource => {
        recommendations.push({
            type: 'resource',
            title: resource.title,
            description: `Recommended ${resource.type} for ${resource.difficulty} level`,
            url: resource.url,
            priority: performanceLevel === 'needs_improvement' ? 'high' : 'medium',
            aiGenerated: false
        });
    });

    return recommendations;
};

// Generate learning path based on course progress
export const generateLearningPath = (courseProgress, courseLessons) => {
    const completedLessons = courseProgress.completedLessons || [];
    const quizScores = courseProgress.quizScores || [];

    const nextLessons = courseLessons.filter(lesson =>
        !completedLessons.includes(lesson.id)
    );

    // If no lessons completed, start with the first lesson
    if (completedLessons.length === 0) {
        return {
            nextLesson: nextLessons[0],
            path: 'beginner',
            message: 'Welcome! Start with the first lesson to begin your learning journey.'
        };
    }

    // Calculate average quiz performance
    const avgScore = quizScores.length > 0
        ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length
        : 0;

    // Determine next lesson based on performance
    let nextLesson;
    if (avgScore < 60) {
        // Poor performance - suggest review or easier content
        nextLesson = nextLessons.find(lesson => lesson.difficulty === 'easy') || nextLessons[0];
        return {
            nextLesson,
            path: 'remedial',
            message: 'Consider reviewing previous lessons before continuing.'
        };
    } else if (avgScore < 80) {
        // Good performance - continue with normal progression
        nextLesson = nextLessons[0];
        return {
            nextLesson,
            path: 'standard',
            message: 'Great progress! Continue with the next lesson.'
        };
    } else {
        // Excellent performance - suggest advanced content
        nextLesson = nextLessons.find(lesson => lesson.difficulty === 'hard') || nextLessons[0];
        return {
            nextLesson,
            path: 'advanced',
            message: 'Excellent work! You\'re ready for more challenging content.'
        };
    }
};

// AI-Powered Auto-grading for different question types
export const autoGradeQuestion = async (question, studentAnswer) => {
    switch (question.type) {
        case 'mcq':
            const mcqCorrect = studentAnswer === question.answer;
            return {
                score: mcqCorrect ? 100 : 0,
                feedback: mcqCorrect
                    ? 'Correct! Great job!'
                    : `Incorrect. The correct answer is: ${question.answer}`,
                strengths: mcqCorrect ? 'You selected the right answer!' : 'You attempted the question.',
                improvements: mcqCorrect ? 'Keep up the excellent work!' : 'Review the lesson material and try again.'
            };

        case 'truefalse':
            const isCorrect = studentAnswer.toString().toLowerCase() === question.answer.toString().toLowerCase();
            return {
                score: isCorrect ? 100 : 0,
                feedback: isCorrect
                    ? 'Correct! Well done!'
                    : `Incorrect. The correct answer is: ${question.answer}`,
                strengths: isCorrect ? 'You understood the concept correctly!' : 'You made an attempt.',
                improvements: isCorrect ? 'Excellent understanding!' : 'Please review the lesson content.'
            };

        case 'short':
            // Use AI for short answer grading
            return await gradeShortAnswer(studentAnswer, question.answer, question.question);

        default:
            return {
                score: 0,
                feedback: 'Unknown question type',
                strengths: 'You submitted an answer.',
                improvements: 'Please contact your teacher for assistance.'
            };
    }
};
