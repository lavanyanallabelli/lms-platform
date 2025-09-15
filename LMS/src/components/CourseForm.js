import React, { useState } from 'react';

const CourseForm = ({ onSubmit, onCancel, initialData = null }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        subject: initialData?.subject || 'math'
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
            <div className="bg-white dark:bg-primary-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200 mb-4">
                        {initialData ? 'Edit Course' : 'Create New Course'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                Course Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                className="input-field"
                                placeholder="Enter course title"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                Subject
                            </label>
                            <select
                                id="subject"
                                name="subject"
                                className="input-field"
                                value={formData.subject}
                                onChange={handleChange}
                            >
                                <option value="math">Mathematics</option>
                                <option value="science">Science</option>
                                <option value="english">English</option>
                                <option value="history">History</option>
                                <option value="art">Art</option>
                                <option value="music">Music</option>
                                <option value="physical-education">Physical Education</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                className="input-field"
                                placeholder="Enter course description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

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
                                {initialData ? 'Update Course' : 'Create Course'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CourseForm;
