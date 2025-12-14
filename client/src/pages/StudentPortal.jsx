import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentTextIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
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
                    className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-12 hover:shadow-2xl transition-all duration-300 group text-center max-w-2xl mx-auto"
                >
                    <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                        <DocumentTextIcon className="h-10 w-10 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Portail des Services Étudiants</h2>
                    <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                        Accédez à tous les services administratifs : demandes d'attestation de scolarité ou de réussite,
                        relevé de notes, convention de stage et dépôt de réclamations pour suivre vos dossiers en toute
                        transparence.
                    </p>
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={() => navigate('/request')}
                            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-12 rounded-xl transition-all shadow-lg hover:shadow-primary-500/30"
                        >
                            Accéder aux Services <ArrowRightIcon className="h-5 w-5 ml-2 inline" />
                        </button>
                        <button
                            onClick={() => navigate('/status')}
                            className="bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold py-4 px-12 rounded-xl transition-all shadow-sm"
                        >
                            Suivre ma Demande
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default StudentPortal;
