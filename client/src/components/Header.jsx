import React from 'react';
import { AcademicCapIcon, UserIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50">
            <div className="bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-[0_10px_30px_-25px_rgba(2,132,199,0.65)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                            <AcademicCapIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Portail Universitaire</h1>
                            <p className="text-sm text-gray-500 font-medium">Services étudiants</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/admin/login')}
                        className="flex items-center text-primary-700 hover:text-primary-800 font-semibold transition-colors px-4 py-2 rounded-xl hover:bg-white/70 border border-transparent hover:border-white/70"
                    >
                        <UserIcon className="h-5 w-5 mr-2" />
                        Accès Admin
                    </button>
                </div>
            </div>
            </div>
        </header>
    );
};

export default Header;
