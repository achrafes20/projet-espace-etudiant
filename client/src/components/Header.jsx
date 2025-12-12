import React from 'react';
import { AcademicCapIcon, UserIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 bg-opacity-80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                            <AcademicCapIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">University Portal</h1>
                            <p className="text-sm text-gray-500 font-medium">Student Services</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/admin/login')}
                        className="flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors px-4 py-2 rounded-md hover:bg-primary-50"
                    >
                        <UserIcon className="h-5 w-5 mr-2" />
                        Admin Login
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
