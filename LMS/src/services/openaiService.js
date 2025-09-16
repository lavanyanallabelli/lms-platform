import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Only for development - in production, use backend
});

// AI-Powered Automated Grading
export const gradeAnswerWithAI = async (question, studentAnswer, correctAnswer) => {
    try {
        const prompt = `
You are an AI tutor grading a student's answer. Please provide a fair and constructive assessment.

Question: "${question}"
Correct Answer: "${correctAnswer}"
Student Answer: "${studentAnswer}"

Please provide:
1. A score from 0-100
2. Constructive feedback
3. What the student did well
4. What they could improve

Respond in JSON format:
{
  "score": number,
  "feedback": "string",
  "strengths": "string",
  "improvements": "string"
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 300
        });

        const response = completion.choices[0].message.content;
        return JSON.parse(response);
    } catch (error) {
        console.error('AI Grading Error:', error);
        // Fallback to rule-based grading
        return {
            score: studentAnswer.toLowerCase().includes(correctAnswer.toLowerCase()) ? 80 : 40,
            feedback: "AI grading unavailable. Please review your answer.",
            strengths: "Answer submitted successfully.",
            improvements: "Consider reviewing the lesson material."
        };
    }
};

// AI-Powered Personalized Learning Recommendations
export const generatePersonalizedRecommendations = async (quizScore, subject, studentAnswers, courseContent) => {
    try {
        const prompt = `
You are an AI learning assistant creating personalized recommendations for a K-12 student.

Student Performance:
- Quiz Score: ${quizScore}%
- Subject: ${subject}
- Student Answers: ${JSON.stringify(studentAnswers)}
- Course Content: ${courseContent}

Based on this performance, provide:
1. Learning path recommendation (remedial, standard, or advanced)
2. Specific study suggestions
3. Recommended resources
4. Motivational message

Respond in JSON format:
{
  "learningPath": "remedial|standard|advanced",
  "studySuggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "recommendedResources": ["resource1", "resource2"],
  "motivationalMessage": "string",
  "nextSteps": "string"
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 400
        });

        const response = completion.choices[0].message.content;
        return JSON.parse(response);
    } catch (error) {
        console.error('AI Recommendations Error:', error);
        // Fallback recommendations
        return {
            learningPath: quizScore < 50 ? "remedial" : quizScore < 80 ? "standard" : "advanced",
            studySuggestions: ["Review lesson materials", "Practice more problems", "Ask for help if needed"],
            recommendedResources: ["Textbook", "Online tutorials"],
            motivationalMessage: "Keep learning and practicing!",
            nextSteps: "Continue with the next lesson"
        };
    }
};

// AI-Powered Content Generation
export const generateLessonContent = async (topic, gradeLevel, subject) => {
    try {
        const prompt = `
You are an AI educational content creator. Create engaging lesson content for K-12 education.

Topic: ${topic}
Grade Level: ${gradeLevel}
Subject: ${subject}

Create:
1. A clear learning objective
2. Engaging introduction
3. Main content with examples
4. Key takeaways
5. Practice questions

Respond in JSON format:
{
  "learningObjective": "string",
  "introduction": "string",
  "mainContent": "string",
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "practiceQuestions": ["question1", "question2"]
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8,
            max_tokens: 500
        });

        const response = completion.choices[0].message.content;
        return JSON.parse(response);
    } catch (error) {
        console.error('AI Content Generation Error:', error);
        return {
            learningObjective: `Learn about ${topic}`,
            introduction: `Today we'll explore ${topic}.`,
            mainContent: `This lesson covers the fundamentals of ${topic}.`,
            keyTakeaways: [`Understanding ${topic}`, "Practical applications"],
            practiceQuestions: ["What did you learn?", "How can you apply this?"]
        };
    }
};

// AI-Powered Quiz Generation
export const generateQuizQuestions = async (topic, subject, difficulty, numberOfQuestions = 5) => {
    try {
        const prompt = `
You are an AI quiz generator creating educational questions for K-12 students.

Topic: ${topic}
Subject: ${subject}
Difficulty: ${difficulty}
Number of Questions: ${numberOfQuestions}

Create a mix of question types:
- Multiple choice (2-3 questions)
- True/False (1-2 questions)
- Short answer (1-2 questions)

For each question, provide:
- Question text
- Question type
- Options (for multiple choice)
- Correct answer
- Explanation

Respond in JSON format:
{
  "questions": [
    {
      "type": "mcq|truefalse|short",
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "string",
      "explanation": "string"
    }
  ]
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
            max_tokens: 800
        });

        const response = completion.choices[0].message.content;
        return JSON.parse(response);
    } catch (error) {
        console.error('AI Quiz Generation Error:', error);
        return {
            questions: [
                {
                    type: "mcq",
                    question: `What is the main concept of ${topic}?`,
                    options: ["Option A", "Option B", "Option C", "Option D"],
                    answer: "A",
                    explanation: "This is the correct answer because..."
                }
            ]
        };
    }
};

// AI-Powered Learning Path Optimization
export const optimizeLearningPath = async (studentProgress, courseContent, performanceHistory) => {
    try {
        const prompt = `
You are an AI learning path optimizer for K-12 education.

Student Progress: ${JSON.stringify(studentProgress)}
Course Content: ${JSON.stringify(courseContent)}
Performance History: ${JSON.stringify(performanceHistory)}

Analyze the student's learning pattern and suggest:
1. Optimal next lesson
2. Areas needing reinforcement
3. Pacing recommendations
4. Learning style adjustments

Respond in JSON format:
{
  "nextLesson": "string",
  "reinforcementAreas": ["area1", "area2"],
  "pacingRecommendation": "slower|normal|faster",
  "learningStyle": "visual|auditory|kinesthetic|mixed",
  "personalizedTips": ["tip1", "tip2", "tip3"]
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 400
        });

        const response = completion.choices[0].message.content;
        return JSON.parse(response);
    } catch (error) {
        console.error('AI Learning Path Error:', error);
        return {
            nextLesson: "Continue with next lesson",
            reinforcementAreas: ["Basic concepts"],
            pacingRecommendation: "normal",
            learningStyle: "mixed",
            personalizedTips: ["Take your time", "Practice regularly", "Ask questions"]
        };
    }
};

// AI-Powered Study Plan Generation
export const generateStudyPlan = async (studentGoals, availableTime, subjects) => {
    console.log('generateStudyPlan called with:', { studentGoals, availableTime, subjects });

    try {
        // Check if OpenAI API key is available
        if (!process.env.REACT_APP_OPENAI_API_KEY) {
            console.warn('OpenAI API key not found, using fallback study plan');
            throw new Error('OpenAI API key not configured');
        }

        const prompt = `
You are an AI study planner creating personalized study schedules for K-12 students.

Student Goals: ${JSON.stringify(studentGoals)}
Available Time: ${availableTime} hours per week
Subjects: ${JSON.stringify(subjects)}

Create a realistic and effective study plan including:
1. Weekly schedule
2. Subject priorities
3. Break recommendations
4. Progress milestones

Respond in JSON format:
{
  "weeklySchedule": {
    "monday": ["subject1", "subject2"],
    "tuesday": ["subject3", "subject1"],
    "wednesday": ["subject4"],
    "thursday": ["subject1", "subject2"],
    "friday": ["review", "practice"],
    "saturday": ["catch-up"],
    "sunday": ["rest"]
  },
  "priorities": ["priority1", "priority2", "priority3"],
  "breakRecommendations": "string",
  "milestones": ["milestone1", "milestone2"]
}
`;

        console.log('Calling OpenAI API...');
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
            max_tokens: 600
        });

        const response = completion.choices[0].message.content;
        console.log('OpenAI response:', response);

        const parsedResult = JSON.parse(response);
        console.log('Parsed result:', parsedResult);
        return parsedResult;
    } catch (error) {
        console.error('AI Study Plan Error:', error);

        // Create a personalized fallback based on the selected subjects and available time
        const weeklySchedule = {};
        const activeDays = availableTime <= 2 ? 2 : availableTime <= 4 ? 3 : 5;
        const studyDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].slice(0, activeDays);

        // Distribute subjects intelligently based on available time
        studyDays.forEach((day, index) => {
            const subjectIndex = index % subjects.length;
            weeklySchedule[day] = [subjects[subjectIndex]];
        });

        // Add weekend activities based on available time
        if (availableTime >= 4) {
            weeklySchedule['saturday'] = ['Review', 'Practice'];
        }
        weeklySchedule['sunday'] = ['Rest'];

        const fallbackPlan = {
            weeklySchedule,
            priorities: subjects.slice(0, 3).concat(['Regular practice', 'Review weak areas']),
            breakRecommendations: `Take 10-15 minute breaks every ${Math.max(1, Math.floor(availableTime / 7))} hours of study. Stay hydrated and get enough sleep.`,
            milestones: [
                'Complete daily study goals',
                'Weekly progress review',
                'Monthly assessment',
                'Improve understanding in weak areas'
            ]
        };

        console.log('Using fallback study plan:', fallbackPlan);
        return fallbackPlan;
    }
};

// AI-Powered PDF Analysis
export const analyzePDFContent = async (pdfText, fileName) => {
    try {
        const prompt = `
You are an AI study assistant analyzing a PDF document for a student. Extract key information and create study materials.

PDF File: ${fileName}
Content: ${pdfText.substring(0, 3000)}... (truncated for analysis)

Please provide:
1. Key concepts and main topics
2. Important definitions and terms
3. Study questions based on the content
4. Summary of main points
5. Suggested study approach

Respond in JSON format:
{
  "keyConcepts": ["concept1", "concept2", "concept3"],
  "definitions": [
    {"term": "term1", "definition": "definition1"},
    {"term": "term2", "definition": "definition2"}
  ],
  "studyQuestions": ["question1", "question2", "question3"],
  "summary": "Brief summary of the document",
  "studyApproach": "Suggested way to study this material"
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 800
        });

        const response = completion.choices[0].message.content;
        return JSON.parse(response);
    } catch (error) {
        console.error('AI PDF Analysis Error:', error);
        return {
            keyConcepts: ["Main Topic 1", "Main Topic 2"],
            definitions: [
                { term: "Key Term 1", definition: "Definition not available" }
            ],
            studyQuestions: ["What is the main topic?", "What are the key points?"],
            summary: "Document analysis unavailable. Please review manually.",
            studyApproach: "Read through the document carefully and take notes."
        };
    }
};

// AI-Powered PDF Q&A
export const answerPDFQuestion = async (question, pdfContent, fileName) => {
    try {
        const prompt = `
You are an AI study assistant helping a student with questions about a PDF document.

PDF File: ${fileName}
Student Question: ${question}
Relevant Content: ${pdfContent.substring(0, 2000)}... (truncated for context)

Please provide a helpful answer based on the PDF content. If the answer isn't in the provided content, say so clearly.

Respond in JSON format:
{
  "answer": "Detailed answer to the student's question",
  "confidence": "high|medium|low",
  "source": "Reference to specific part of the document if applicable",
  "followUpQuestions": ["suggested question 1", "suggested question 2"]
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
            max_tokens: 500
        });

        const response = completion.choices[0].message.content;
        return JSON.parse(response);
    } catch (error) {
        console.error('AI PDF Q&A Error:', error);
        return {
            answer: "I'm sorry, I couldn't process your question at the moment. Please try again or review the document manually.",
            confidence: "low",
            source: "Unable to determine",
            followUpQuestions: ["What is the main topic?", "Can you explain the key concepts?"]
        };
    }
};

// AI-Powered General Search/Chat (like ChatGPT)
export const generalAISearch = async (query, conversationHistory = []) => {
    console.log('General AI search called with:', { query, historyLength: conversationHistory.length });

    try {
        // Check if OpenAI API key is available
        if (!process.env.REACT_APP_OPENAI_API_KEY) {
            console.warn('OpenAI API key not found, using fallback response');
            throw new Error('OpenAI API key not configured');
        }

        // Build conversation context
        const messages = [
            {
                role: "system",
                content: `You are an intelligent AI assistant for students. You help with:
                - Academic questions across all subjects
                - Study strategies and learning techniques
                - Problem-solving and explanations
                - Research and general knowledge
                - Homework help and concept clarification
                
                Provide clear, helpful, and educational responses. When explaining concepts, break them down into understandable parts. For complex topics, provide examples.`
            }
        ];

        // Add conversation history
        conversationHistory.forEach(msg => {
            messages.push({ role: "user", content: msg.question });
            messages.push({ role: "assistant", content: msg.answer });
        });

        // Add current query
        messages.push({ role: "user", content: query });

        console.log('Calling OpenAI API for general search...');
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        });

        const response = completion.choices[0].message.content;
        console.log('OpenAI general search response received');

        return {
            answer: response,
            confidence: 'high',
            type: 'general',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('AI General Search Error:', error);

        // Fallback responses based on query content
        let fallbackAnswer = '';
        const queryLower = query.toLowerCase();

        if (queryLower.includes('math') || queryLower.includes('calculate') || queryLower.includes('solve')) {
            fallbackAnswer = "I'd be happy to help with math problems! For specific calculations or problem-solving, please provide the exact problem you're working on. I can help with algebra, geometry, calculus, statistics, and more.";
        } else if (queryLower.includes('science') || queryLower.includes('physics') || queryLower.includes('chemistry')) {
            fallbackAnswer = "I can help explain scientific concepts! Whether it's physics principles, chemical reactions, biology processes, or earth science topics, feel free to ask specific questions about what you're studying.";
        } else if (queryLower.includes('history') || queryLower.includes('when') || queryLower.includes('who')) {
            fallbackAnswer = "I can help with historical questions and research! Ask me about specific events, historical figures, time periods, or cultural developments you're studying.";
        } else if (queryLower.includes('english') || queryLower.includes('writing') || queryLower.includes('essay')) {
            fallbackAnswer = "I can assist with English and writing tasks! This includes essay structure, grammar questions, literary analysis, reading comprehension, and writing techniques.";
        } else if (queryLower.includes('study') || queryLower.includes('learn') || queryLower.includes('tips')) {
            fallbackAnswer = "Here are some effective study strategies: 1) Break study sessions into 25-50 minute focused blocks, 2) Use active recall by testing yourself, 3) Create summaries and concept maps, 4) Study in a distraction-free environment, 5) Review material regularly rather than cramming.";
        } else {
            fallbackAnswer = "I'm here to help with your academic questions! I can assist with math, science, history, English, study strategies, and many other topics. Feel free to ask me anything specific you're working on or curious about.";
        }

        return {
            answer: fallbackAnswer,
            confidence: 'medium',
            type: 'general',
            timestamp: new Date().toISOString()
        };
    }
};

// AI-Powered Study Notes Enhancement
export const enhanceStudyNotes = async (noteContent, lessonTitle = '', subject = '') => {
    try {
        const prompt = `
You are an AI study assistant helping a student improve their study notes.

Note Content: ${noteContent}
Lesson/Subject: ${lessonTitle} (${subject})

Please provide:
1. Key terms that should be highlighted
2. Related concepts to explore
3. Study questions based on the notes
4. Suggestions for improvement
5. Related resources to consider

Respond in JSON format:
{
  "keyTerms": ["term1", "term2", "term3"],
  "relatedConcepts": ["concept1", "concept2"],
  "studyQuestions": ["question1", "question2", "question3"],
  "improvementSuggestions": ["suggestion1", "suggestion2"],
  "relatedResources": ["resource1", "resource2"]
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
            max_tokens: 500
        });

        const response = completion.choices[0].message.content;
        return JSON.parse(response);
    } catch (error) {
        console.error('AI Notes Enhancement Error:', error);
        return {
            keyTerms: ["Important concept", "Key definition"],
            relatedConcepts: ["Related topic 1", "Related topic 2"],
            studyQuestions: ["What is the main idea?", "How does this work?"],
            improvementSuggestions: ["Add more examples", "Include diagrams"],
            relatedResources: ["Textbook chapter", "Online tutorial"]
        };
    }
};