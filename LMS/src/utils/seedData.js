// Sample data seeding utility for development
// This file contains sample data that can be used to populate Firestore collections

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Sample resources for AI recommendations
export const sampleResources = [
    {
        title: "Khan Academy Math Basics",
        subject: "math",
        difficulty: "easy",
        type: "video",
        url: "https://www.khanacademy.org/math/arithmetic"
    },
    {
        title: "Math Worksheets - Addition & Subtraction",
        subject: "math",
        difficulty: "easy",
        type: "worksheet",
        url: "https://www.math-drills.com/addition.shtml"
    },
    {
        title: "Algebra Fundamentals",
        subject: "math",
        difficulty: "medium",
        type: "video",
        url: "https://www.khanacademy.org/math/algebra"
    },
    {
        title: "Advanced Calculus",
        subject: "math",
        difficulty: "hard",
        type: "video",
        url: "https://www.khanacademy.org/math/calculus-1"
    },
    {
        title: "Basic Science Concepts",
        subject: "science",
        difficulty: "easy",
        type: "video",
        url: "https://www.khanacademy.org/science/biology"
    },
    {
        title: "Chemistry Lab Worksheets",
        subject: "science",
        difficulty: "medium",
        type: "worksheet",
        url: "https://www.chem4kids.com/files/atom_intro.html"
    },
    {
        title: "Physics Problem Sets",
        subject: "science",
        difficulty: "hard",
        type: "worksheet",
        url: "https://www.physicsclassroom.com/class"
    },
    {
        title: "Grammar Basics",
        subject: "english",
        difficulty: "easy",
        type: "video",
        url: "https://www.khanacademy.org/humanities/grammar"
    },
    {
        title: "Creative Writing Prompts",
        subject: "english",
        difficulty: "medium",
        type: "worksheet",
        url: "https://www.creativewritingprompts.com/"
    },
    {
        title: "Advanced Literature Analysis",
        subject: "english",
        difficulty: "hard",
        type: "video",
        url: "https://www.khanacademy.org/humanities/art-history"
    }
];

// Sample course data
export const sampleCourse = {
    title: "Introduction to Mathematics",
    description: "A comprehensive introduction to basic mathematical concepts including arithmetic, algebra, and geometry. Perfect for students beginning their mathematical journey.",
    subject: "math",
    teacherId: "sample-teacher-id", // Replace with actual teacher ID
    teacherName: "Sample Teacher",
    lessons: [
        {
            id: "lesson-1",
            title: "Introduction to Numbers",
            contentType: "text",
            content: "Numbers are the foundation of mathematics. In this lesson, we'll explore the different types of numbers including natural numbers, whole numbers, integers, and rational numbers. Understanding these concepts is crucial for all future mathematical learning.",
            createdAt: new Date().toISOString()
        },
        {
            id: "lesson-2",
            title: "Basic Addition and Subtraction",
            contentType: "video",
            content: "https://www.khanacademy.org/math/arithmetic/addition-subtraction",
            createdAt: new Date().toISOString()
        },
        {
            id: "lesson-3",
            title: "Multiplication Tables",
            contentType: "text",
            content: "Multiplication is repeated addition. Learning multiplication tables helps with mental math and builds a strong foundation for more complex mathematical operations. Practice makes perfect!",
            createdAt: new Date().toISOString()
        }
    ],
    createdAt: new Date().toISOString()
};

// Sample quiz data
export const sampleQuiz = {
    title: "Math Basics Quiz",
    description: "Test your understanding of basic mathematical concepts",
    courseId: "sample-course-id", // Replace with actual course ID
    questions: [
        {
            id: "q1",
            type: "mcq",
            question: "What is 5 + 3?",
            options: ["6", "7", "8", "9"],
            answer: "C"
        },
        {
            id: "q2",
            type: "truefalse",
            question: "Zero is a natural number.",
            answer: "false"
        },
        {
            id: "q3",
            type: "short",
            question: "Explain what multiplication means in your own words.",
            answer: "Multiplication is repeated addition or finding the total of equal groups.",
            keywords: ["repeated", "addition", "equal", "groups", "total"]
        },
        {
            id: "q4",
            type: "mcq",
            question: "Which of the following is an integer?",
            options: ["1/2", "3.14", "-5", "√2"],
            answer: "C"
        },
        {
            id: "q5",
            type: "truefalse",
            question: "All whole numbers are natural numbers.",
            answer: "false"
        }
    ],
    createdAt: new Date().toISOString()
};

// Function to seed resources
export const seedResources = async () => {
    try {
        const promises = sampleResources.map(resource =>
            addDoc(collection(db, 'resources'), resource)
        );
        await Promise.all(promises);
        console.log('Resources seeded successfully');
    } catch (error) {
        console.error('Error seeding resources:', error);
    }
};

// Function to seed a sample course
export const seedSampleCourse = async (teacherId, teacherName) => {
    try {
        const courseData = {
            ...sampleCourse,
            teacherId,
            teacherName
        };
        const docRef = await addDoc(collection(db, 'courses'), courseData);
        console.log('Sample course created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating sample course:', error);
    }
};

// Function to seed a sample quiz
export const seedSampleQuiz = async (courseId) => {
    try {
        const quizData = {
            ...sampleQuiz,
            courseId
        };
        const docRef = await addDoc(collection(db, 'quizzes'), quizData);
        console.log('Sample quiz created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating sample quiz:', error);
    }
};

// Complete seeding function
export const seedAllData = async (teacherId, teacherName) => {
    try {
        console.log('Starting data seeding...');

        // Seed resources
        await seedResources();

        // Create sample course
        const courseId = await seedSampleCourse(teacherId, teacherName);

        // Create sample quiz for the course
        if (courseId) {
            await seedSampleQuiz(courseId);
        }

        console.log('Data seeding completed successfully!');
    } catch (error) {
        console.error('Error during data seeding:', error);
    }
};

// Usage instructions:
// 1. Import this file in your component or create a separate seeding script
// 2. Call seedAllData(teacherId, teacherName) with actual teacher credentials
// 3. This will create sample resources, a course, and a quiz for testing

// Example usage in a component:
// import { seedAllData } from '../utils/seedData';
//
// const handleSeedData = async () => {
//   await seedAllData(user.uid, userProfile.name);
// };
