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
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Réclamation envoyée</h2>
                        <p className="text-gray-600 mb-8">Votre réclamation a été reçue et sera examinée dans les plus brefs délais.</p>
                        <button onClick={() => navigate('/')} className="btn-primary">
                            Retour au portail
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
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center border-2 border-red-200">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Déposer une réclamation</h1>
                            <p className="text-gray-500">Signaler un problème concernant votre demande</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Référence de la demande *</label>
                            <input
                                required
                                type="text"
                                className="input-field"
                                placeholder="ex: AS-2025-001"
                                value={formData.request_reference}
                                onChange={e => setFormData({ ...formData, request_reference: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse Email *</label>
                            <input
                                required
                                type="email"
                                className="input-field"
                                placeholder="etudiant@university.edu"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Motif *</label>
                            <select
                                required
                                className="input-field"
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            >
                                <option value="">Sélectionnez un motif</option>
                                <option value="Retard">Retard de traitement</option>
                                <option value="Erreur">Informations incorrectes</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                            <textarea
                                required
                                rows="5"
                                className="input-field resize-none"
                                placeholder="Décrivez votre problème en détail..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>

                        {error && <div className="text-red-500 text-sm bg-red-50 p-4 rounded-lg">{error}</div>}

                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Envoi en cours...' : 'Envoyer la réclamation'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ComplaintForm;
