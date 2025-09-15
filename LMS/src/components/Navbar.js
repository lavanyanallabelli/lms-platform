import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOutUser } from '../firebase/auth';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = ({ user, userProfile }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        const result = await signOutUser();
        if (result.success) {
            navigate('/login');
        }
    };

    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    const getNavLinkClass = (path) => {
        const baseClass = "transition-colors";
        const activeClass = "text-primary-800 dark:text-primary-200 font-medium";
        const inactiveClass = "text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200";

        return `${baseClass} ${isActiveRoute(path) ? activeClass : inactiveClass}`;
    };

    return (
        <nav className="bg-white dark:bg-primary-800 shadow-sm border-b border-primary-200 dark:border-primary-700">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">L</span>
                        </div>
                        <span className="text-xl font-semibold text-primary-800 dark:text-primary-200">
                            LMS
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link
                            to="/dashboard"
                            className={getNavLinkClass('/dashboard')}
                        >
                            Dashboard
                        </Link>

                        {userProfile?.role === 'teacher' && (
                            <Link
                                to="/dashboard"
                                className={getNavLinkClass('/dashboard')}
                            >
                                My Courses
                            </Link>
                        )}

                        {userProfile?.role === 'student' && (
                            <>
                                <Link
                                    to="/my-learning"
                                    className={getNavLinkClass('/my-learning')}
                                >
                                    My Learning
                                </Link>
                                <Link
                                    to="/study-plans"
                                    className={getNavLinkClass('/study-plans')}
                                >
                                    Study Plans
                                </Link>
                                <Link
                                    to="/pdf-study-tool"
                                    className={getNavLinkClass('/pdf-study-tool')}
                                >
                                    PDF Study Tool
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Right side - Theme toggle and user menu */}
                    <div className="flex items-center space-x-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-primary-100 dark:bg-primary-700 hover:bg-primary-200 dark:hover:bg-primary-600 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 transition-colors"
                            >
                                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                        {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <span className="hidden md:block text-primary-800 dark:text-primary-200 font-medium">
                                    {userProfile?.name || 'User'}
                                </span>
                                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-primary-800 rounded-lg shadow-lg border border-primary-200 dark:border-primary-700 py-1 z-50">
                                    <div className="px-4 py-2 border-b border-primary-200 dark:border-primary-700">
                                        <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
                                            {userProfile?.name}
                                        </p>
                                        <p className="text-xs text-primary-600 dark:text-primary-400">
                                            {userProfile?.role === 'teacher' ? 'Teacher' : 'Student'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2 text-sm text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-700 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 transition-colors"
                    >
                        <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-primary-200 dark:border-primary-700">
                        <div className="flex flex-col space-y-2">
                            <Link
                                to="/dashboard"
                                className={`px-4 py-2 rounded-lg transition-colors ${isActiveRoute('/dashboard')
                                    ? 'bg-primary-100 dark:bg-primary-700 text-primary-800 dark:text-primary-200 font-medium'
                                    : 'text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-700'
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Dashboard
                            </Link>

                            {userProfile?.role === 'student' && (
                                <>
                                    <Link
                                        to="/my-learning"
                                        className={`px-4 py-2 rounded-lg transition-colors ${isActiveRoute('/my-learning')
                                            ? 'bg-primary-100 dark:bg-primary-700 text-primary-800 dark:text-primary-200 font-medium'
                                            : 'text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-700'
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        My Learning
                                    </Link>
                                    <Link
                                        to="/study-plans"
                                        className={`px-4 py-2 rounded-lg transition-colors ${isActiveRoute('/study-plans')
                                            ? 'bg-primary-100 dark:bg-primary-700 text-primary-800 dark:text-primary-200 font-medium'
                                            : 'text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-700'
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Study Plans
                                    </Link>
                                    <Link
                                        to="/pdf-study-tool"
                                        className={`px-4 py-2 rounded-lg transition-colors ${isActiveRoute('/pdf-study-tool')
                                            ? 'bg-primary-100 dark:bg-primary-700 text-primary-800 dark:text-primary-200 font-medium'
                                            : 'text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-700'
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        PDF Study Tool
                                    </Link>
                                </>
                            )}

                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-2 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-700 rounded-lg transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
