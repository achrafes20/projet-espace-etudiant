import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { validateStudent, createRequest, createComplaint, checkField } from '../services/api';
import Header from '../components/Header';

const RequestForm = () => {
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [selection, setSelection] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        email: '',
        apogee_number: '',
        cin: '',
        specific_details: {},
        request_reference: '',
        reason: '',
        description: ''
    });

    // Validation States: 'neutral', 'loading', 'valid', 'invalid'
    const [fieldStatus, setFieldStatus] = useState({
        email: 'neutral',
        apogee_number: 'neutral',
        cin: 'neutral'
    });

    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [identityError, setIdentityError] = useState('');

    // Real-time field check
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
            console.error('Check failed', error);
            setFieldStatus(prev => ({ ...prev, [field]: 'invalid' }));
        }
    };

    // Auto-validate identity when all 3 fields are valid
    useEffect(() => {
        const checkIdentity = async () => {
            if (fieldStatus.email === 'valid' && fieldStatus.apogee_number === 'valid' && fieldStatus.cin === 'valid') {
                try {
                    const res = await validateStudent({
                        email: formData.email,
                        apogee_number: formData.apogee_number,
                        cin: formData.cin
                    });
                    if (res.data.valid) {
                        setStudent(res.data.student);
                        setIdentityError('');
                    }
                } catch (error) {
                    setIdentityError('Les informations sont valides individuellement mais ne correspondent pas au même étudiant.');
                    setStudent(null);
                }
            } else {
                setStudent(null);
            }
        };

        checkIdentity();
    }, [fieldStatus.email, fieldStatus.apogee_number, fieldStatus.cin, formData.email, formData.apogee_number, formData.cin]);


    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (selection === 'reclamation') {
                const res = await createComplaint({
                    request_reference: formData.request_reference,
                    email: student.email,
                    reason: formData.reason,
                    description: formData.description
                });
                setSuccessData({ type: 'complaint', ...res.data });
            } else {
                const res = await createRequest({
                    student_id: student.id,
                    document_type: selection,
                    specific_details: formData.specific_details
                });
                setSuccessData({ type: 'request', ...res.data });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateDetails = (key, value) => {
        setFormData(prev => ({
            ...prev,
            specific_details: { ...prev.specific_details, [key]: value }
        }));
    };

    const options = [
        { value: '', label: 'Choisissez une option...' },
        { value: 'school-certificate', label: 'Attestation de Scolarité' },
        { value: 'success-certificate', label: 'Attestation de Réussite' },
        { value: 'transcript', label: 'Relevé de Notes' },
        { value: 'internship', label: 'Convention de Stage' },
        { value: 'reclamation', label: 'Réclamation' }
    ];

    const getIcon = (status) => {
        if (status === 'loading') return <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full" />;
        if (status === 'valid') return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
        if (status === 'invalid') return <XCircleIcon className="h-6 w-6 text-red-500" />;
        return null;
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
                <button onClick={() => navigate('/')} className="text-primary-600 hover:text-primary-700 font-medium mb-8 flex items-center transition-colors">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" /> Retour au Portail
                </button>

                {!successData ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8"
                    >
                        {/* SECTION 1: IDENTITY */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">1. Identification</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 transition-colors ${fieldStatus.email === 'invalid' ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-500'}`}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        onBlur={() => handleBlur('email')}
                                        placeholder="etudiant@university.edu"
                                    />
                                    <div className="absolute right-3 top-3">
                                        {getIcon(fieldStatus.email)}
                                    </div>
                                </div>
                                {fieldStatus.email === 'invalid' && <p className="text-red-500 text-sm mt-1">Email introuvable.</p>}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Code Apogée</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 transition-colors ${fieldStatus.apogee_number === 'invalid' ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-500'}`}
                                            value={formData.apogee_number}
                                            onChange={e => setFormData({ ...formData, apogee_number: e.target.value })}
                                            onBlur={() => handleBlur('apogee_number')}
                                            placeholder="12345678"
                                        />
                                        <div className="absolute right-3 top-3">
                                            {getIcon(fieldStatus.apogee_number)}
                                        </div>
                                    </div>
                                    {fieldStatus.apogee_number === 'invalid' && <p className="text-red-500 text-sm mt-1">Code incorrect.</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">CNE / CIN</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 transition-colors ${fieldStatus.cin === 'invalid' ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-500'}`}
                                            value={formData.cin}
                                            onChange={e => setFormData({ ...formData, cin: e.target.value })}
                                            onBlur={() => handleBlur('cin')}
                                            placeholder="AB123456"
                                        />
                                        <div className="absolute right-3 top-3">
                                            {getIcon(fieldStatus.cin)}
                                        </div>
                                    </div>
                                    {fieldStatus.cin === 'invalid' && <p className="text-red-500 text-sm mt-1">CIN incorrect.</p>}
                                </div>
                            </div>

                            {identityError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    {identityError}
                                </div>
                            )}

                            {student && !identityError && (
                                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
                                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                                    Bonjour, <strong>{student.first_name} {student.last_name}</strong>. Identité vérifiée.
                                </div>
                            )}
                        </div>

                        {/* SECTION 2: SERVICE */}
                        <div className={`space-y-6 transition-opacity duration-500 ${student ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">2. Service Demandé</h2>

                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">De quoi avez-vous besoin ?</label>
                                <select
                                    value={selection}
                                    onChange={(e) => setSelection(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium text-gray-800"
                                >
                                    {options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Dynamic Fields Area */}
                            <div className="space-y-6 mb-8">
                                {/* RECLAMATION FIELDS */}
                                {selection === 'reclamation' && (
                                    <div className="animate-fade-in space-y-6 border-t border-gray-100 pt-6">
                                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-yellow-800 text-sm mb-4">
                                            Veuillez fournir la référence de la demande concernée par la réclamation.
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Référence de la Demande</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="ex: AS-2025-001"
                                                value={formData.request_reference}
                                                onChange={e => setFormData({ ...formData, request_reference: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Motif</label>
                                            <select
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                value={formData.reason}
                                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                            >
                                                <option value="">Sélectionnez un motif</option>
                                                <option value="Delay">Retard de traitement</option>
                                                <option value="Error">Informations incorrectes</option>
                                                <option value="Other">Autre</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                            <textarea
                                                rows="4"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="Décrivez votre problème..."
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                )}

                                {/* INTERNSHIP FIELDS */}
                                {selection === 'internship' && (
                                    <div className="animate-fade-in space-y-6 border-t border-gray-100 pt-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'Entreprise</label>
                                            <input type="text" onChange={e => updateDetails('company_name', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Date de Début</label>
                                                <input type="date" onChange={e => updateDetails('start_date', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Date de Fin</label>
                                                <input type="date" onChange={e => updateDetails('end_date', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TRANSCRIPT FIELDS */}
                                {selection === 'transcript' && (
                                    <div className="animate-fade-in border-t border-gray-100 pt-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Année Universitaire</label>
                                        <select onChange={e => updateDetails('academic_year', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                                            <option value="">Sélectionnez l'année</option>
                                            <option value="2024-2025">2024-2025</option>
                                            <option value="2023-2024">2023-2024</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={!selection || loading}
                                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {loading ? 'Traitement...' : 'Soumettre la demande'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center"
                    >
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircleIcon className="h-12 w-12 text-green-600" />
                        </div>

                        {successData.type === 'complaint' ? (
                            <>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Réclamation Envoyée</h2>
                                <p className="text-gray-600 mb-8">Nous avons bien reçu votre réclamation concernant la demande {formData.request_reference}.</p>
                                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 mb-8 max-w-md mx-auto">
                                    <p className="text-lg text-yellow-800 font-medium mb-2">Vérifiez votre Email</p>
                                    <p className="text-gray-600">
                                        Nous avons envoyé un email de confirmation à <b>{formData.email}</b> contenant le numéro de référence de votre réclamation.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-4">Veuillez conserver ce numéro pour suivre l'état de votre réclamation.</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Demande Envoyée !</h2>
                                <p className="text-gray-600 mb-8">Nous avons bien reçu votre demande.</p>
                                <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 mb-8 max-w-md mx-auto">
                                    <p className="text-lg text-primary-800 font-medium mb-2">Vérifiez votre Email</p>
                                    <p className="text-gray-600">
                                        Nous avons envoyé un email de confirmation à <b>{student?.email}</b> contenant votre <b>Référence de Demande</b> unique.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-4">Veuillez conserver cette référence pour suivre votre demande.</p>
                                </div>
                            </>
                        )}
                        <button onClick={() => navigate('/')} className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-8 rounded-lg transition-colors">
                            Retour au Portail
                        </button>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default RequestForm;
