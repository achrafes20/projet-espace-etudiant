import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { adminLogin } from '../services/api';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await adminLogin(formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('admin', JSON.stringify(res.data.admin));
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg">
                        <UserIcon className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Admin Portal</h2>
                    <p className="mt-2 text-sm text-gray-600">Sign in to manage requests</p>
                </div>

                <div className="bg-white py-8 px-10 shadow-2xl rounded-2xl border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                                    placeholder="admin@university.edu"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-lg">{error}</div>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>

                        <div className="text-center">
                            <button type="button" onClick={() => navigate('/')} className="text-sm font-medium text-gray-600 hover:text-gray-500">
                                Back to Student Portal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
