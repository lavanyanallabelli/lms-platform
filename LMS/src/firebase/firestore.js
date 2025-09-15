import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import { db } from './config';

// Courses CRUD operations
export const createCourse = async (courseData) => {
    try {
        const docRef = await addDoc(collection(db, 'courses'), courseData);
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getCourses = async (teacherId = null) => {
    try {
        let q = collection(db, 'courses');
        if (teacherId) {
            q = query(collection(db, 'courses'), where('teacherId', '==', teacherId));
        }
        const querySnapshot = await getDocs(q);
        const courses = [];
        querySnapshot.forEach((doc) => {
            courses.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: courses };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getCourse = async (courseId) => {
    try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, error: 'Course not found' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateCourse = async (courseId, courseData) => {
    try {
        const docRef = doc(db, 'courses', courseId);
        await updateDoc(docRef, courseData);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteCourse = async (courseId) => {
    try {
        await deleteDoc(doc(db, 'courses', courseId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Quizzes CRUD operations
export const createQuiz = async (quizData) => {
    try {
        const docRef = await addDoc(collection(db, 'quizzes'), quizData);
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getQuizzes = async (courseId) => {
    try {
        const q = query(collection(db, 'quizzes'), where('courseId', '==', courseId));
        const querySnapshot = await getDocs(q);
        const quizzes = [];
        querySnapshot.forEach((doc) => {
            quizzes.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: quizzes };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getQuiz = async (quizId) => {
    try {
        const docRef = doc(db, 'quizzes', quizId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, error: 'Quiz not found' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Results operations
export const saveQuizResult = async (resultData) => {
    try {
        console.log('Firestore: Attempting to save result with data:', resultData);
        const docRef = await addDoc(collection(db, 'results'), resultData);
        console.log('Firestore: Successfully saved result with ID:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Firestore: Error saving result:', error);
        return { success: false, error: error.message };
    }
};

export const getStudentResults = async (studentId) => {
    try {
        const q = query(
            collection(db, 'results'),
            where('studentId', '==', studentId)
        );
        const querySnapshot = await getDocs(q);
        const results = [];
        querySnapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() });
        });

        // Sort by timestamp in JavaScript instead of Firestore
        results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        return { success: true, data: results };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Resources operations
export const getResources = async (subject = null, difficulty = null) => {
    try {
        let q = collection(db, 'resources');
        if (subject) {
            q = query(collection(db, 'resources'), where('subject', '==', subject));
        }
        if (difficulty) {
            q = query(collection(db, 'resources'), where('difficulty', '==', difficulty));
        }
        const querySnapshot = await getDocs(q);
        const resources = [];
        querySnapshot.forEach((doc) => {
            resources.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: resources };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// User progress operations
export const updateUserProgress = async (userId, courseId, progressData) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const updatedProgress = {
                ...userData.progress,
                [courseId]: {
                    ...userData.progress[courseId],
                    ...progressData
                }
            };

            await updateDoc(userRef, { progress: updatedProgress });
            return { success: true };
        } else {
            return { success: false, error: 'User not found' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Lesson progress operations
export const updateLessonProgress = async (userId, lessonId, status, courseId) => {
    try {
        const progressData = {
            studentId: userId,
            lessonId: lessonId,
            courseId: courseId,
            status: status, // 'opened' or 'completed'
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString()
        };

        console.log('Saving lesson progress:', progressData);
        const docRef = await addDoc(collection(db, 'lessonProgress'), progressData);
        console.log('Lesson progress saved successfully:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error saving lesson progress:', error);
        return { success: false, error: error.message };
    }
};

export const getLessonProgress = async (userId, courseId = null) => {
    try {
        let q = query(
            collection(db, 'lessonProgress'),
            where('studentId', '==', userId)
        );

        if (courseId) {
            q = query(
                collection(db, 'lessonProgress'),
                where('studentId', '==', userId),
                where('courseId', '==', courseId)
            );
        }

        const querySnapshot = await getDocs(q);
        const progress = [];
        querySnapshot.forEach((doc) => {
            progress.push({ id: doc.id, ...doc.data() });
        });

        // Sort by timestamp in JavaScript instead of Firestore
        progress.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return { success: true, data: progress };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Study plan operations
export const saveStudyPlan = async (studyPlanData) => {
    try {
        const planData = {
            ...studyPlanData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'studyPlans'), planData);
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getStudyPlans = async (userId) => {
    try {
        const q = query(
            collection(db, 'studyPlans'),
            where('studentId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const plans = [];
        querySnapshot.forEach((doc) => {
            plans.push({ id: doc.id, ...doc.data() });
        });

        // Sort by createdAt in JavaScript instead of Firestore
        plans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return { success: true, data: plans };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateStudyPlan = async (planId, updateData) => {
    try {
        const planRef = doc(db, 'studyPlans', planId);
        await updateDoc(planRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteStudyPlan = async (planId) => {
    try {
        await deleteDoc(doc(db, 'studyPlans', planId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// PDF Study Tool operations
export const savePDFDocument = async (pdfData) => {
    try {
        const docData = {
            ...pdfData,
            uploadedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'pdfDocuments'), docData);
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getPDFDocuments = async (userId) => {
    try {
        console.log('Fetching PDF documents for userId:', userId);
        const q = query(
            collection(db, 'pdfDocuments'),
            where('studentId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const documents = [];
        querySnapshot.forEach((doc) => {
            const docData = { id: doc.id, ...doc.data() };
            console.log('Found document:', docData);
            documents.push(docData);
        });

        // Sort by uploadedAt in JavaScript instead of Firestore
        documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        console.log('Total documents for user:', documents.length);
        return { success: true, data: documents };
    } catch (error) {
        console.error('Error fetching PDF documents:', error);
        return { success: false, error: error.message };
    }
};

export const updatePDFDocument = async (docId, updateData) => {
    try {
        const docRef = doc(db, 'pdfDocuments', docId);
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deletePDFDocument = async (docId) => {
    try {
        await deleteDoc(doc(db, 'pdfDocuments', docId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Study Notes operations
export const saveStudyNote = async (noteData) => {
    try {
        const docData = {
            ...noteData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'studyNotes'), docData);
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getStudyNotes = async (userId, lessonId = null, quizId = null) => {
    try {
        let q = query(
            collection(db, 'studyNotes'),
            where('studentId', '==', userId)
        );

        if (lessonId) {
            q = query(
                collection(db, 'studyNotes'),
                where('studentId', '==', userId),
                where('lessonId', '==', lessonId)
            );
        }

        if (quizId) {
            q = query(
                collection(db, 'studyNotes'),
                where('studentId', '==', userId),
                where('quizId', '==', quizId)
            );
        }

        const querySnapshot = await getDocs(q);
        const notes = [];
        querySnapshot.forEach((doc) => {
            notes.push({ id: doc.id, ...doc.data() });
        });

        // Sort by updatedAt in JavaScript instead of Firestore
        notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        return { success: true, data: notes };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateStudyNote = async (noteId, updateData) => {
    try {
        const noteRef = doc(db, 'studyNotes', noteId);
        await updateDoc(noteRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteStudyNote = async (noteId) => {
    try {
        await deleteDoc(doc(db, 'studyNotes', noteId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
