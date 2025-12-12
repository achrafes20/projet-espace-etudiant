import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { createComplaint } from '../services/api';
import Header from '../components/Header';

const ComplaintForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        request_reference: '',
        email: '',
        reason: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await createComplaint(formData);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />
                <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-xl p-12 text-center w-full">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ExclamationTriangleIcon className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Complaint Submitted</h2>
                        <p className="text-gray-600 mb-8">We have received your complaint and will review it shortly.</p>
                        <button onClick={() => navigate('/')} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-lg transition-colors">
                            Return Home
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
                <button onClick={() => navigate('/')} className="text-primary-600 hover:text-primary-700 font-medium mb-8 flex items-center transition-colors">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" /> Cancel & Back
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Submit Complaint</h1>
                            <p className="text-gray-500">Report an issue with your request</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Request Reference Number</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                placeholder="REQ-2024-..."
                                value={formData.request_reference}
                                onChange={e => setFormData({ ...formData, request_reference: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                                required
                                type="email"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                placeholder="student@university.edu"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                            <select
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white transition-all"
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            >
                                <option value="">Select a reason</option>
                                <option value="Delay">Processing Delay</option>
                                <option value="Error">Incorrect Information</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                required
                                rows="5"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                                placeholder="Describe your issue..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>

                        {error && <div className="text-red-500 text-sm bg-red-50 p-4 rounded-lg">{error}</div>}

                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-lg shadow-red-500/30 disabled:opacity-50">
                                {loading ? 'Submitting...' : 'Submit Complaint'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ComplaintForm;
