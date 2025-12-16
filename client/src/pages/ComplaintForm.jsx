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
            setError(err.userMessage || err.response?.data?.message || 'Échec de l’envoi. Réessayez.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col bg-hero">
                <Header />
                <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full flex items-center justify-center">
                    <div className="card-glass text-center w-full">
                        <div className="w-20 h-20 bg-gradient-to-br from-success-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/20 ring-1 ring-white/40">
                            <ExclamationTriangleIcon className="h-10 w-10 text-white" />
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
        <div className="min-h-screen flex flex-col bg-hero">
            <Header />
            <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
                <button onClick={() => navigate('/')} className="text-primary-800 hover:text-primary-900 font-semibold mb-8 flex items-center transition-colors">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" /> Retour au portail
                </button>

                <div className="card-glass">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/15 ring-1 ring-white/35">
                            <ExclamationTriangleIcon className="h-6 w-6 text-white" />
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

                        {error && (
                            <div className="text-red-600 text-sm bg-red-50/70 border border-red-100 p-4 rounded-xl">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={loading} className="btn-danger px-8">
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
