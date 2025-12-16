import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { checkStatus, checkField } from '../services/api';
import Header from '../components/Header';

const StatusCheck = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ reference: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const [fieldStatus, setFieldStatus] = useState({
        reference: 'neutral',
        email: 'neutral'
    });

    const handleBlur = async (field) => {
        const value = formData[field];
        if (!value) {
            setFieldStatus(prev => ({ ...prev, [field]: 'neutral' }));
            return;
        }

        setFieldStatus(prev => ({ ...prev, [field]: 'loading' }));

        try {
            const res = await checkField({ field, value });
            if (res.data.exists) {
                setFieldStatus(prev => ({ ...prev, [field]: 'valid' }));
            } else {
                setFieldStatus(prev => ({ ...prev, [field]: 'invalid' }));
            }
        } catch (error) {
            setFieldStatus(prev => ({ ...prev, [field]: 'invalid' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await checkStatus(formData);
            setResult(res.data);
        } catch (err) {
            setError(err.userMessage || err.response?.data?.message || 'Statut introuvable ou email incorrect.');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (status) => {
        if (status === 'loading') return <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full" />;
        if (status === 'valid') return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
        if (status === 'invalid') return <XCircleIcon className="h-6 w-6 text-red-500" />;
        return null;
    };

    const documentTypeLabels = {
        'school-certificate': 'Attestation de scolarité',
        'success-certificate': 'Attestation de réussite',
        transcript: 'Relevé de notes',
        internship: 'Convention de stage'
    };

    const formatDocType = (type) => documentTypeLabels[type] || type;

    return (
        <div className="min-h-screen flex flex-col bg-hero">
            <Header />
            <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full space-y-8">
                <button onClick={() => navigate('/')} className="text-primary-800 hover:text-primary-900 font-semibold flex items-center transition-colors">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" /> Retour au Portail
                </button>

                <div className="card-glass space-y-6">
                    <h2 className="text-3xl font-extrabold title-gradient">Suivre ma Demande</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Référence de la Demande</label>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    className={`input-field pr-12 ${fieldStatus.reference === 'invalid' ? 'ring-2 ring-red-200 border-red-200' : ''}`}
                                    placeholder="ex: AS-2025-001"
                                    value={formData.reference}
                                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                    onBlur={() => handleBlur('reference')}
                                />
                                <div className="absolute right-3 top-3">
                                    {getIcon(fieldStatus.reference)}
                                </div>
                            </div>
                            {fieldStatus.reference === 'invalid' && <p className="text-red-600 text-sm mt-2">Référence introuvable.</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse Email</label>
                            <div className="relative">
                                <input
                                    required
                                    type="email"
                                    className={`input-field pr-12 ${fieldStatus.email === 'invalid' ? 'ring-2 ring-red-200 border-red-200' : ''}`}
                                    placeholder="etudiant@university.edu"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    onBlur={() => handleBlur('email')}
                                />
                                <div className="absolute right-3 top-3">
                                    {getIcon(fieldStatus.email)}
                                </div>
                            </div>
                            {fieldStatus.email === 'invalid' && <p className="text-red-600 text-sm mt-2">Email introuvable.</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={loading || fieldStatus.email === 'invalid' || fieldStatus.reference === 'invalid'}
                            className="w-full btn-primary flex items-center justify-center"
                        >
                            {loading ? 'Vérification...' : (
                                <>
                                    <MagnifyingGlassIcon className="h-5 w-5 mr-2" /> Vérifier le Statut
                                </>
                            )}
                        </button>
                    </form>
                    {error && (
                        <div className="text-red-600 text-sm bg-red-50/70 border border-red-100 p-4 rounded-xl">
                            {error}
                        </div>
                    )}
                </div>

                {result && (
                    <div className="card-glass space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{formatDocType(result.document_type)}</h3>
                                <p className="text-sm text-gray-500">Réf: {result.reference}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${result.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                                    result.status === 'Accepté' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                }`}>
                                {result.status}
                            </span>
                        </div>

                        <div className="border-t border-gray-100 pt-6 space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date de Soumission</p>
                                <p className="text-gray-900">{new Date(result.submission_date).toLocaleDateString()}</p>
                            </div>

                            {result.status === 'Refusé' && (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                    <p className="text-sm font-bold text-red-800 mb-1">Motif du Refus</p>
                                    <p className="text-red-700">{result.refusal_reason}</p>
                                </div>
                            )}

                            {result.status === 'Accepté' && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <p className="text-sm font-bold text-green-800 mb-1">Statut du Document</p>
                                    <p className="text-green-700">
                                        Votre document est prêt. {result.document_path ? 'Il a été envoyé sur votre email.' : "Veuillez le récupérer au bureau de l'administration."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StatusCheck;
