import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentTextIcon, ExclamationCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Header from '../components/Header';

const StudentPortal = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full grid md:grid-cols-2 gap-8 items-center">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 hover:shadow-2xl transition-all duration-300 group"
                >
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Request Documents</h2>
                    <p className="text-gray-600 mb-8 text-lg leading-relaxed">Submit a request for school certificates, transcripts, or internship agreements with just a few clicks.</p>
                    <button
                        onClick={() => navigate('/request')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center shadow-lg hover:shadow-blue-500/30"
                    >
                        Start Request <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 hover:shadow-2xl transition-all duration-300 group"
                >
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Submit Complaint</h2>
                    <p className="text-gray-600 mb-8 text-lg leading-relaxed">Report an issue or submit a complaint regarding your request processing or outcomes.</p>
                    <button
                        onClick={() => navigate('/complaint')}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center shadow-lg hover:shadow-red-500/30"
                    >
                        File Complaint <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </button>
                </motion.div>

            </main>
        </div>
    );
};

export default StudentPortal;
