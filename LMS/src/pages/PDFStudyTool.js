import React, { useState, useEffect, useCallback } from 'react';
import { getPDFDocuments, savePDFDocument, deletePDFDocument } from '../firebase/firestore';
import { analyzePDFContent, answerPDFQuestion } from '../services/openaiService';
import LoadingSpinner from '../components/LoadingSpinner';

const PDFStudyTool = ({ user, userProfile }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState(null);
    const [asking, setAsking] = useState(false);

    const loadDocuments = useCallback(async () => {
        setLoading(true);
        console.log('Loading PDF documents for user:', user.uid);
        const result = await getPDFDocuments(user.uid);
        console.log('PDF documents result:', result);

        if (result.success) {
            // Double-check filtering on client side for security
            const userDocuments = result.data.filter(doc => doc.studentId === user.uid);
            console.log('Filtered documents:', userDocuments);
            setDocuments(userDocuments);
        } else {
            setError(result.error);
        }
        setLoading(false);
    }, [user.uid]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file only.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File size must be less than 10MB.');
            return;
        }

        setUploading(true);
        setError('');

        try {
            // Convert PDF to text (simplified - in production, use a proper PDF parser)
            const text = await extractTextFromPDF(file);

            // Analyze with AI
            setAnalyzing(true);
            const analysis = await analyzePDFContent(text, file.name);

            // Save to database
            const docData = {
                studentId: user.uid,
                fileName: file.name,
                fileSize: file.size,
                content: text,
                analysis: analysis,
                keyConcepts: analysis.keyConcepts,
                definitions: analysis.definitions,
                studyQuestions: analysis.studyQuestions,
                summary: analysis.summary,
                studyApproach: analysis.studyApproach
            };

            const result = await savePDFDocument(docData);
            if (result.success) {
                await loadDocuments();
                setSelectedDocument({ id: result.id, ...docData });
            } else {
                setError('Failed to save document: ' + result.error);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            setError('Failed to process PDF. Please try again.');
        }

        setUploading(false);
        setAnalyzing(false);
        event.target.value = ''; // Reset file input
    };

    // Simplified PDF text extraction (in production, use a proper library)
    const extractTextFromPDF = async (file) => {
        return new Promise((resolve) => {
            // This is a placeholder - in production, use pdf-parse or similar
            const reader = new FileReader();
            reader.onload = () => {
                // For demo purposes, return a sample text
                // In production, implement proper PDF parsing
                const sampleText = `
                    This is a sample PDF content for demonstration purposes.
                    In a real implementation, you would use a library like pdf-parse
                    to extract actual text from the PDF file.
                    
                    Key concepts in this document include:
                    - Machine Learning
                    - Artificial Intelligence
                    - Data Science
                    
                    Important definitions:
                    - Algorithm: A set of rules or instructions
                    - Model: A representation of a system
                    - Training: The process of teaching a model
                    
                    Study questions:
                    1. What is machine learning?
                    2. How does AI work?
                    3. What are the applications of data science?
                `;
                resolve(sampleText);
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const handleAskQuestion = async () => {
        if (!question.trim() || !selectedDocument) return;

        setAsking(true);
        setError('');

        try {
            const result = await answerPDFQuestion(question, selectedDocument.content, selectedDocument.fileName);
            setAnswer(result);
        } catch (error) {
            console.error('Q&A Error:', error);
            setError('Failed to get answer. Please try again.');
        }

        setAsking(false);
    };

    const handleDeleteDocument = async (docId) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            const result = await deletePDFDocument(docId);
            if (result.success) {
                setDocuments(prev => prev.filter(doc => doc.id !== docId));
                if (selectedDocument && selectedDocument.id === docId) {
                    setSelectedDocument(null);
                }
            } else {
                setError(result.error);
            }
        }
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
                        AI PDF Study Tool
                    </h1>
                    <p className="text-primary-600 dark:text-primary-400 mt-2">
                        Upload PDFs and get AI-powered study assistance with key notes and Q&A.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <label className="btn-primary cursor-pointer">
                        {uploading ? 'Uploading...' : 'Upload PDF'}
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Upload Progress */}
            {(uploading || analyzing) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-blue-600 dark:text-blue-400">
                            {uploading ? 'Uploading and processing PDF...' : 'AI is analyzing your document...'}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Documents List */}
                <div className="lg:col-span-1">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                                My Documents ({documents.length})
                            </h2>
                        </div>
                        <div className="card-body">
                            {documents.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-primary-800 dark:text-primary-200">No documents</h3>
                                    <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
                                        Upload your first PDF to get started.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedDocument?.id === doc.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-800'
                                                : 'border-primary-200 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-800'
                                                }`}
                                            onClick={() => setSelectedDocument(doc)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-primary-800 dark:text-primary-200 text-sm">
                                                        {doc.fileName}
                                                    </h3>
                                                    <p className="text-xs text-primary-500 dark:text-primary-500 mt-1">
                                                        {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                                                    </p>
                                                    <p className="text-xs text-primary-500 dark:text-primary-500">
                                                        {new Date(doc.uploadedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteDocument(doc.id);
                                                    }}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 ml-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Document Analysis & Q&A */}
                <div className="lg:col-span-2">
                    {selectedDocument ? (
                        <div className="space-y-6">
                            {/* Document Info */}
                            <div className="card">
                                <div className="card-header">
                                    <h2 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                                        {selectedDocument.fileName}
                                    </h2>
                                </div>
                                <div className="card-body">
                                    <p className="text-primary-600 dark:text-primary-400 mb-4">
                                        {selectedDocument.summary}
                                    </p>

                                    {/* Key Concepts */}
                                    <div className="mb-4">
                                        <h3 className="font-medium text-primary-800 dark:text-primary-200 mb-2">
                                            Key Concepts
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedDocument.keyConcepts?.map((concept, index) => (
                                                <span key={index} className="bg-primary-100 dark:bg-primary-700 text-primary-600 dark:text-primary-400 text-sm px-2 py-1 rounded">
                                                    {concept}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Definitions */}
                                    {selectedDocument.definitions && selectedDocument.definitions.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="font-medium text-primary-800 dark:text-primary-200 mb-2">
                                                Important Definitions
                                            </h3>
                                            <div className="space-y-2">
                                                {selectedDocument.definitions.map((def, index) => (
                                                    <div key={index} className="bg-primary-50 dark:bg-primary-800 rounded-lg p-3">
                                                        <strong className="text-primary-800 dark:text-primary-200">{def.term}:</strong>
                                                        <span className="text-primary-600 dark:text-primary-400 ml-2">{def.definition}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Study Questions */}
                                    {selectedDocument.studyQuestions && selectedDocument.studyQuestions.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="font-medium text-primary-800 dark:text-primary-200 mb-2">
                                                Study Questions
                                            </h3>
                                            <div className="space-y-2">
                                                {selectedDocument.studyQuestions.map((question, index) => (
                                                    <div key={index} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                                        <p className="text-primary-800 dark:text-primary-200">
                                                            {index + 1}. {question}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Study Approach */}
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                        <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                                            Suggested Study Approach
                                        </h3>
                                        <p className="text-green-600 dark:text-green-400">
                                            {selectedDocument.studyApproach}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Q&A Section */}
                            <div className="card">
                                <div className="card-header">
                                    <h2 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                                        Ask Questions About This Document
                                    </h2>
                                </div>
                                <div className="card-body">
                                    <div className="space-y-4">
                                        <div>
                                            <textarea
                                                value={question}
                                                onChange={(e) => setQuestion(e.target.value)}
                                                placeholder="Ask a question about the document..."
                                                rows={3}
                                                className="input-field"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAskQuestion}
                                            disabled={asking || !question.trim()}
                                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {asking ? 'Asking...' : 'Ask AI'}
                                        </button>

                                        {/* Answer Display */}
                                        {answer && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <h3 className="font-medium text-blue-800 dark:text-blue-200">
                                                        AI Answer
                                                    </h3>
                                                    <span className={`badge ${answer.confidence === 'high' ? 'badge-success' :
                                                        answer.confidence === 'medium' ? 'badge-warning' :
                                                            'badge-danger'
                                                        }`}>
                                                        {answer.confidence} confidence
                                                    </span>
                                                </div>
                                                <p className="text-blue-600 dark:text-blue-400 mb-3">
                                                    {answer.answer}
                                                </p>
                                                {answer.source && (
                                                    <p className="text-sm text-blue-500 dark:text-blue-500">
                                                        Source: {answer.source}
                                                    </p>
                                                )}

                                                {/* Follow-up Questions */}
                                                {answer.followUpQuestions && answer.followUpQuestions.length > 0 && (
                                                    <div className="mt-4">
                                                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                                            Suggested Follow-up Questions:
                                                        </h4>
                                                        <div className="space-y-1">
                                                            {answer.followUpQuestions.map((q, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => setQuestion(q)}
                                                                    className="block w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
                                                                >
                                                                    • {q}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-body text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-primary-800 dark:text-primary-200">Select a document</h3>
                                <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
                                    Choose a document from the list to view AI analysis and ask questions.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PDFStudyTool;
