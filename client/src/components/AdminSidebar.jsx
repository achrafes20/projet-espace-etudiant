import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Squares2X2Icon,
    DocumentTextIcon,
    ExclamationCircleIcon,
    ClockIcon,
    ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Squares2X2Icon, path: '/admin/dashboard' },
        { id: 'requests', label: 'Demandes', icon: DocumentTextIcon, path: '/admin/requests' },
        { id: 'history', label: 'Historique', icon: ClockIcon, path: '/admin/history' },
        { id: 'complaints', label: 'Réclamations', icon: ExclamationCircleIcon, path: '/admin/complaints' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        navigate('/admin/login');
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-xl">A</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 leading-tight">Admin Panel</h2>
                        <p className="text-xs text-gray-500 font-medium">Student Services</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm ring-1 ring-primary-100'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3 px-2 py-2 mb-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                        {admin.first_name?.[0]}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate">{admin.first_name} {admin.last_name}</p>
                        <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
