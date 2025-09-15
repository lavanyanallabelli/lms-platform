import React, { useState, useEffect, useCallback } from 'react';
import { getStudyNotes, saveStudyNote, updateStudyNote, deleteStudyNote } from '../firebase/firestore';
import { enhanceStudyNotes } from '../services/openaiService';

const StudyNotes = ({ user, lessonId, quizId, lessonTitle, courseTitle }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [enhancing, setEnhancing] = useState(false);
    const [error, setError] = useState('');
    const [newNote, setNewNote] = useState('');
    const [editingNote, setEditingNote] = useState(null);
    const [aiSuggestions, setAiSuggestions] = useState(null);

    const loadNotes = useCallback(async () => {
        setLoading(true);
        const result = await getStudyNotes(user.uid, lessonId, quizId);
        if (result.success) {
            setNotes(result.data);
        } else {
            setError(result.error);
        }
        setLoading(false);
    }, [user.uid, lessonId, quizId]);

    useEffect(() => {
        loadNotes();
    }, [lessonId, quizId, loadNotes]);

    const handleSaveNote = async () => {
        if (!newNote.trim()) return;

        setSaving(true);
        setError('');

        try {
            const noteData = {
                studentId: user.uid,
                content: newNote.trim(),
                lessonId: lessonId || null,
                quizId: quizId || null,
                lessonTitle: lessonTitle || '',
                courseTitle: courseTitle || '',
                tags: [],
                aiEnhanced: false
            };

            const result = await saveStudyNote(noteData);
            if (result.success) {
                setNewNote('');
                await loadNotes();
            } else {
                setError('Failed to save note: ' + result.error);
            }
        } catch (error) {
            console.error('Save Note Error:', error);
            setError('Failed to save note. Please check your connection and try again.');
        }

        setSaving(false);
    };

    const handleUpdateNote = async (noteId, content) => {
        setSaving(true);
        setError('');

        try {
            const result = await updateStudyNote(noteId, { content: content.trim() });
            if (result.success) {
                setEditingNote(null);
                await loadNotes();
            } else {
                setError('Failed to update note: ' + result.error);
            }
        } catch (error) {
            console.error('Update Note Error:', error);
            setError('Failed to update note. Please try again.');
        }

        setSaving(false);
    };

    const handleDeleteNote = async (noteId) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            const result = await deleteStudyNote(noteId);
            if (result.success) {
                setNotes(prev => prev.filter(note => note.id !== noteId));
            } else {
                setError(result.error);
            }
        }
    };

    const handleEnhanceNotes = async (noteContent) => {
        setEnhancing(true);
        setError('');

        try {
            const suggestions = await enhanceStudyNotes(noteContent, lessonTitle, courseTitle);
            setAiSuggestions(suggestions);
        } catch (error) {
            console.error('Enhance Notes Error:', error);
            setError('Failed to get AI suggestions. Please try again.');
        }

        setEnhancing(false);
    };

    const applySuggestion = (suggestion) => {
        setNewNote(prev => prev + '\n\n' + suggestion);
        setAiSuggestions(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">
                        Study Notes
                    </h2>
                    <p className="text-primary-600 dark:text-primary-400 text-sm">
                        {lessonTitle ? `Notes for: ${lessonTitle}` : 'General study notes'}
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Add New Note */}
            <div className="card">
                <div className="card-header">
                    <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                        Add New Note
                    </h3>
                </div>
                <div className="card-body">
                    <div className="space-y-4">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Write your study notes here..."
                            rows={4}
                            className="input-field"
                        />
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => handleEnhanceNotes(newNote)}
                                disabled={enhancing || !newNote.trim()}
                                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {enhancing ? 'Getting AI Suggestions...' : 'Get AI Suggestions'}
                            </button>
                            <button
                                onClick={handleSaveNote}
                                disabled={saving || !newNote.trim()}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Note'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Suggestions */}
            {aiSuggestions && (
                <div className="card">
                    <div className="card-header">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                                AI Study Suggestions
                            </h3>
                            <button
                                onClick={() => setAiSuggestions(null)}
                                className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="space-y-4">
                            {/* Key Terms */}
                            {aiSuggestions.keyTerms && aiSuggestions.keyTerms.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-primary-800 dark:text-primary-200 mb-2">
                                        Key Terms to Highlight
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {aiSuggestions.keyTerms.map((term, index) => (
                                            <span key={index} className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm px-2 py-1 rounded">
                                                {term}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Study Questions */}
                            {aiSuggestions.studyQuestions && aiSuggestions.studyQuestions.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-primary-800 dark:text-primary-200 mb-2">
                                        Study Questions
                                    </h4>
                                    <div className="space-y-2">
                                        {aiSuggestions.studyQuestions.map((question, index) => (
                                            <div key={index} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                                <p className="text-green-600 dark:text-green-400">{question}</p>
                                                <button
                                                    onClick={() => applySuggestion(question)}
                                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 ml-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Improvement Suggestions */}
                            {aiSuggestions.improvementSuggestions && aiSuggestions.improvementSuggestions.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-primary-800 dark:text-primary-200 mb-2">
                                        Improvement Suggestions
                                    </h4>
                                    <div className="space-y-2">
                                        {aiSuggestions.improvementSuggestions.map((suggestion, index) => (
                                            <div key={index} className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                                                <p className="text-yellow-600 dark:text-yellow-400">{suggestion}</p>
                                                <button
                                                    onClick={() => applySuggestion(suggestion)}
                                                    className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 ml-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Related Concepts */}
                            {aiSuggestions.relatedConcepts && aiSuggestions.relatedConcepts.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-primary-800 dark:text-primary-200 mb-2">
                                        Related Concepts to Explore
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {aiSuggestions.relatedConcepts.map((concept, index) => (
                                            <span key={index} className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm px-2 py-1 rounded">
                                                {concept}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Notes List */}
            <div className="space-y-4">
                {notes.length === 0 ? (
                    <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-primary-800 dark:text-primary-200">No notes yet</h3>
                        <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
                            Start by adding your first study note above.
                        </p>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="card">
                            <div className="card-body">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        {editingNote === note.id ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    defaultValue={note.content}
                                                    rows={4}
                                                    className="input-field"
                                                    ref={(textarea) => {
                                                        if (textarea) {
                                                            textarea.focus();
                                                            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && e.ctrlKey) {
                                                            handleUpdateNote(note.id, e.target.value);
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setEditingNote(null);
                                                        }
                                                    }}
                                                />
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={(e) => handleUpdateNote(note.id, e.target.previousElementSibling.value)}
                                                        disabled={saving}
                                                        className="btn-primary text-sm disabled:opacity-50"
                                                    >
                                                        {saving ? 'Saving...' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingNote(null)}
                                                        className="btn-secondary text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-primary-800 dark:text-primary-200 whitespace-pre-wrap">
                                                    {note.content}
                                                </p>
                                                <p className="text-xs text-primary-500 dark:text-primary-500 mt-2">
                                                    {new Date(note.updatedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {editingNote !== note.id && (
                                        <div className="flex space-x-2 ml-4">
                                            <button
                                                onClick={() => setEditingNote(note.id)}
                                                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StudyNotes;
