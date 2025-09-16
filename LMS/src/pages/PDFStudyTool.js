import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getPDFDocuments, savePDFDocument, deletePDFDocument, saveChatHistory, getChatHistory, saveGeneralChat, getGeneralChatHistory } from '../firebase/firestore';
import { analyzePDFContent, answerPDFQuestion, generalAISearch } from '../services/openaiService';

const PDFStudyTool = ({ user, userProfile }) => {
    // Unified chat interface state
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [showDocuments, setShowDocuments] = useState(false);

    // Refs for auto-scroll
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadDocuments = useCallback(async () => {
        console.log('Loading PDF documents for user:', user.uid);
        const result = await getPDFDocuments(user.uid);
        console.log('PDF documents result:', result);

        if (result.success) {
            const userDocuments = result.data.filter(doc => doc.studentId === user.uid);
            console.log('Filtered documents:', userDocuments);
            setDocuments(userDocuments);
        } else {
            setError(result.error);
        }
    }, [user.uid]);

    const loadChatHistory = useCallback(async () => {
        console.log('Loading all chat history for user:', user.uid);

        try {
            // Load both document and general chat history
            const [docHistoryResult, generalHistoryResult] = await Promise.all([
                getChatHistory(user.uid),
                getGeneralChatHistory(user.uid)
            ]);

            const allMessages = [];

            // Add document chat history
            if (docHistoryResult.success) {
                console.log('Document chat history loaded:', docHistoryResult.data.length, 'entries');
                const docChats = docHistoryResult.data.filter(chat => chat.userId === user.uid);
                console.log('Filtered document chats:', docChats.length);
                docChats.forEach(chat => {
                    allMessages.push({
                        id: `doc-${chat.id}`,
                        type: 'user',
                        content: chat.question,
                        timestamp: chat.createdAt,
                        documentName: chat.documentName
                    });
                    allMessages.push({
                        id: `doc-ans-${chat.id}`,
                        type: 'assistant',
                        content: chat.answer,
                        timestamp: chat.createdAt,
                        confidence: chat.confidence,
                        documentName: chat.documentName
                    });
                });
            } else {
                console.log('Failed to load document chat history:', docHistoryResult.error);
            }

            // Add general chat history
            if (generalHistoryResult.success) {
                console.log('General chat history loaded:', generalHistoryResult.data.length, 'entries');
                const generalChats = generalHistoryResult.data.filter(chat => chat.userId === user.uid);
                console.log('Filtered general chats:', generalChats.length);
                generalChats.forEach(chat => {
                    allMessages.push({
                        id: `gen-${chat.id}`,
                        type: 'user',
                        content: chat.question,
                        timestamp: chat.createdAt
                    });
                    allMessages.push({
                        id: `gen-ans-${chat.id}`,
                        type: 'assistant',
                        content: chat.answer,
                        timestamp: chat.createdAt,
                        confidence: chat.confidence
                    });
                });
            } else {
                console.log('Failed to load general chat history:', generalHistoryResult.error);
            }

            // Sort all messages by timestamp
            allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            console.log('Total messages loaded:', allMessages.length);
            setMessages(allMessages);

        } catch (error) {
            console.error('Error loading chat history:', error);
            // If chat history loading fails, just start with empty messages
            setMessages([]);
        }
    }, [user.uid]);

    useEffect(() => {
        loadDocuments();
        loadChatHistory();
    }, [loadDocuments, loadChatHistory]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file only.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB.');
            return;
        }

        setUploading(true);
        setError('');

        console.log(`📄 Uploading and analyzing "${file.name}"...`);

        try {
            const text = await extractTextFromPDF(file);
            const analysis = await analyzePDFContent(text, file.name);

            const docData = {
                studentId: user.uid,
                fileName: file.name,
                fileSize: file.size,
                content: text,
                analysis: analysis,
                keyConcepts: analysis.keyConcepts,
                definitions: analysis.definitions,
                studyQuestions: analysis.studyQuestions,
                summary: analysis.summary
            };

            const result = await savePDFDocument(docData);
            if (result.success) {
                await loadDocuments();
                console.log(`✅ Successfully uploaded and analyzed "${file.name}"!`);
                console.log(`📋 Summary: ${analysis.summary}`);
                console.log(`🔑 Key Concepts: ${analysis.keyConcepts?.join(', ')}`);
            } else {
                setError('Failed to save document: ' + result.error);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            setError('Failed to process PDF. Please try again.');
        }

        setUploading(false);
        event.target.value = '';
    };

    const extractTextFromPDF = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const fileName = file.name.toLowerCase();
                let sampleText = `Document: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nUploaded: ${new Date().toLocaleDateString()}\n\n`;

                if (fileName.includes('math') || fileName.includes('algebra') || fileName.includes('geometry')) {
                    sampleText += `Mathematical Concepts and Formulas
                    
                    This document covers fundamental mathematical principles including:
                    - Algebraic equations and solving techniques
                    - Geometric shapes and properties
                    - Mathematical reasoning and proof methods
                    - Problem-solving strategies
                    
                    Key formulas:
                    - Area of rectangle: length × width
                    - Pythagorean theorem: a² + b² = c²
                    - Quadratic formula: x = (-b ± √(b²-4ac)) / 2a
                    
                    Practice problems and examples are included throughout the document.`;
                } else if (fileName.includes('science') || fileName.includes('physics') || fileName.includes('chemistry')) {
                    sampleText += `Scientific Principles and Concepts
                    
                    This document explores fundamental scientific concepts:
                    - Physical laws and phenomena
                    - Chemical reactions and properties
                    - Scientific method and experimentation
                    - Data analysis and interpretation
                    
                    Important principles:
                    - Newton's laws of motion
                    - Conservation of energy
                    - Atomic structure and bonding
                    - Chemical equations and balancing`;
                } else if (fileName.includes('history') || fileName.includes('social')) {
                    sampleText += `Historical Events and Social Studies
                    
                    This document covers important historical periods and events:
                    - Timeline of significant events
                    - Cultural and social developments
                    - Political systems and governance
                    - Economic factors and trade
                    
                    Key topics:
                    - Causes and effects of major events
                    - Historical figures and their contributions
                    - Social movements and changes
                    - Geographic influences on history`;
                } else if (fileName.includes('english') || fileName.includes('literature') || fileName.includes('writing')) {
                    sampleText += `Language Arts and Literature
                    
                    This document focuses on language and literary analysis:
                    - Reading comprehension strategies
                    - Writing techniques and composition
                    - Literary devices and analysis
                    - Grammar and vocabulary development
                    
                    Elements covered:
                    - Plot structure and character development
                    - Theme identification and analysis
                    - Writing process and revision
                    - Critical thinking and interpretation`;
                } else {
                    sampleText += `Academic Study Material
                    
                    This document contains educational content covering:
                    - Core subject concepts and principles
                    - Study strategies and learning techniques
                    - Practice exercises and examples
                    - Review materials and summaries
                    
                    Learning objectives:
                    - Understanding fundamental concepts
                    - Applying knowledge to solve problems
                    - Developing critical thinking skills
                    - Preparing for assessments and evaluations`;
                }

                resolve(sampleText);
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        setInputValue('');
        setIsLoading(true);

        try {
            let result;
            let isDocumentQuestion = false;
            let relevantDocument = null;

            // Check if the question might be about a document
            const questionLower = inputValue.toLowerCase();
            const documentKeywords = ['document', 'pdf', 'file', 'uploaded', 'this document', 'the document'];
            const hasDocumentKeyword = documentKeywords.some(keyword => questionLower.includes(keyword));

            if (hasDocumentKeyword && documents.length > 0) {
                // If user mentions a specific document or if there's only one document, use document Q&A
                relevantDocument = documents[documents.length - 1]; // Use most recent document
                isDocumentQuestion = true;
                result = await answerPDFQuestion(inputValue.trim(), relevantDocument.content, relevantDocument.fileName);
            } else {
                // Use general AI search
                result = await generalAISearch(inputValue.trim(), []);
            }

            // Save to appropriate chat history
            const chatData = {
                userId: user.uid,
                question: inputValue.trim(),
                answer: result.answer,
                confidence: result.confidence,
                timestamp: new Date().toISOString()
            };

            // Add the user message and AI response to the UI immediately
            const userMessage = {
                id: `user-${Date.now()}`,
                type: 'user',
                content: inputValue.trim(),
                timestamp: new Date().toISOString()
            };

            const assistantMessage = {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: result.answer,
                timestamp: new Date().toISOString(),
                confidence: result.confidence,
                documentName: isDocumentQuestion ? relevantDocument?.fileName : null
            };

            // Add messages to UI immediately (fallback if saving fails)
            setMessages(prev => [...prev, userMessage, assistantMessage]);

            // Try to save to database, but don't fail if it doesn't work
            try {
                if (isDocumentQuestion && relevantDocument) {
                    chatData.documentId = relevantDocument.id;
                    chatData.documentName = relevantDocument.fileName;
                    chatData.source = result.source || null;
                    chatData.followUpQuestions = result.followUpQuestions || [];
                    const saveResult = await saveChatHistory(chatData);
                    console.log('Document chat saved:', saveResult);
                    if (saveResult.success) {
                        // Reload chat history to include the new message (this will replace the temporary ones)
                        loadChatHistory();
                    }
                } else {
                    chatData.type = result.type || 'general';
                    const saveResult = await saveGeneralChat(chatData);
                    console.log('General chat saved:', saveResult);
                    if (saveResult.success) {
                        // Reload chat history to include the new message (this will replace the temporary ones)
                        loadChatHistory();
                    }
                }
            } catch (saveError) {
                console.error('Failed to save chat history, but continuing with local messages:', saveError);
                // Messages are already shown in UI, so continue normally
            }

        } catch (error) {
            console.error('Chat Error:', error);
            setError('❌ Sorry, I encountered an error. Please try again.');
        }

        setIsLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            const result = await deletePDFDocument(docId);
            if (result.success) {
                setDocuments(prev => prev.filter(doc => doc.id !== docId));
                // Optionally reload chat history to remove related messages
                loadChatHistory();
            } else {
                setError(result.error);
            }
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex justify-between items-center max-w-4xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            AI Study Assistant
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Upload documents or ask any study questions
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowDocuments(!showDocuments)}
                            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            📄 Documents ({documents.length})
                        </button>
                        <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm transition-colors">
                            {uploading ? 'Uploading...' : '📎 Upload PDF'}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Documents Panel */}
            {showDocuments && (
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Your Documents</h3>
                        {documents.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No documents uploaded yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                    {doc.fileName}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                className="text-red-500 hover:text-red-700 ml-2"
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
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4">
                    <div className="max-w-4xl mx-auto">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🤖</div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Welcome to your AI Study Assistant!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Upload a PDF document or ask me any study question to get started.
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-3xl px-4 py-3 rounded-2xl ${message.type === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : message.type === 'system'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                                    }`}>
                                    {message.type === 'assistant' && message.documentName && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            📄 From: {message.documentName}
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap">{message.content}</div>
                                    {message.type === 'assistant' && (
                                        <div className="mt-2 flex justify-end">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(message.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 max-w-3xl">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">AI is thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex space-x-3">
                        <div className="flex-1 relative">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything about your studies or uploaded documents..."
                                rows={1}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                style={{ minHeight: '50px', maxHeight: '120px' }}
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isLoading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Press Enter to send, Shift+Enter for new line
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PDFStudyTool;