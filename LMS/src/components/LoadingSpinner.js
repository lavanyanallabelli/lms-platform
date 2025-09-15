import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-50 dark:bg-primary-900">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-700 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-primary-600 dark:text-primary-400 font-medium">Loading...</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
