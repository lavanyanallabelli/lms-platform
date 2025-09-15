import React, { useState } from 'react';

const LessonForm = ({ onSubmit, onCancel, initialData = null }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        contentType: initialData?.contentType || 'text',
        content: initialData?.content || ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-primary-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200 mb-4">
                        {initialData ? 'Edit Lesson' : 'Add New Lesson'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                Lesson Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                className="input-field"
                                placeholder="Enter lesson title"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="contentType" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                Content Type
                            </label>
                            <select
                                id="contentType"
                                name="contentType"
                                className="input-field"
                                value={formData.contentType}
                                onChange={handleChange}
                            >
                                <option value="text">Text Content</option>
                                <option value="video">Video Link</option>
                                <option value="pdf">PDF Document</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                {formData.contentType === 'text' && 'Lesson Content'}
                                {formData.contentType === 'video' && 'Video URL'}
                                {formData.contentType === 'pdf' && 'PDF URL or Description'}
                            </label>
                            {formData.contentType === 'text' ? (
                                <textarea
                                    id="content"
                                    name="content"
                                    rows={8}
                                    required
                                    className="input-field"
                                    placeholder="Enter lesson content..."
                                    value={formData.content}
                                    onChange={handleChange}
                                />
                            ) : (
                                <input
                                    type="url"
                                    id="content"
                                    name="content"
                                    required
                                    className="input-field"
                                    placeholder={
                                        formData.contentType === 'video'
                                            ? 'https://youtube.com/watch?v=...'
                                            : 'https://example.com/document.pdf'
                                    }
                                    value={formData.content}
                                    onChange={handleChange}
                                />
                            )}
                        </div>

                        {formData.contentType === 'video' && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-blue-600 dark:text-blue-400 text-sm">
                                    <strong>Tip:</strong> You can use YouTube, Vimeo, or any other video platform. Make sure the URL is publicly accessible.
                                </p>
                            </div>
                        )}

                        {formData.contentType === 'pdf' && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-blue-600 dark:text-blue-400 text-sm">
                                    <strong>Tip:</strong> Upload your PDF to a cloud storage service (Google Drive, Dropbox, etc.) and share the public link here.
                                </p>
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
                            >
                                {initialData ? 'Update Lesson' : 'Add Lesson'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LessonForm;
