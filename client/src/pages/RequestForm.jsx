
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, PlusIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { validateStudent, createRequest, createComplaint, checkField } from '../services/api';
import Header from '../components/Header';

const baseDetails = {
    academic_year: '2024/2025',
    session: 'Session 1',
    company_name: '',
    company_address: '',
    company_email: '',
    company_phone: '',
    supervisor_name: '',
    supervisor_role: '',
    internship_subject: '',
    start_date: '',
    end_date: ''
};

const createDefaultDetails = () => ({ ...baseDetails });

const RequestForm = () => {
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [selection, setSelection] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        apogee_number: '',
        cin: '',
        specific_details: createDefaultDetails(),
        request_reference: '',
        reason: '',
        description: ''
    });

    const [fieldStatus, setFieldStatus] = useState({
        email: 'neutral',
        apogee_number: 'neutral',
        cin: 'neutral'
    });

    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [identityError, setIdentityError] = useState('');
    const handleBlur = async (field) => {
        const value = formData[field];
        if (!value) {
            setFieldStatus(prev => ({ ...prev, [field]: 'neutral' }));
            return;
        }
        setFieldStatus(prev => ({ ...prev, [field]: 'loading' }));
        try {
            const res = await checkField({ field, value });
            setFieldStatus(prev => ({ ...prev, [field]: res.data.exists ? 'valid' : 'invalid' }));
        } catch (error) {
            setFieldStatus(prev => ({ ...prev, [field]: 'invalid' }));
        }
    };

    useEffect(() => {
        const verifyIdentity = async () => {
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
                    setStudent(null);
                    setIdentityError('Les informations sont valides individuellement mais ne correspondent pas au même étudiant.');
                }
            } else {
                setStudent(null);
            }
        };
        verifyIdentity();
    }, [fieldStatus, formData.email, formData.apogee_number, formData.cin]);

    const updateDetails = (key, value) => {
        setFormData(prev => ({
            ...prev,
            specific_details: { ...prev.specific_details, [key]: value }
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (selection === 'reclamation') {
                const res = await createComplaint({
                    request_reference: formData.request_reference,
                    email: formData.email,
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

    const getIcon = (status) => {
        if (status === 'loading') return <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full" />;
        if (status === 'valid') return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
        if (status === 'invalid') return <XCircleIcon className="h-6 w-6 text-red-500" />;
        return null;
    };
    const renderSpecificFields = () => {
        switch (selection) {
            case 'school-certificate':
                return (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
                            L'attestation sera générée automatiquement à partir des informations de l'étudiant. Choisissez juste l'année.
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Année universitaire</label>
                            <input type="text" value={formData.specific_details.academic_year} onChange={e => updateDetails('academic_year', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                    </div>
                );
            case 'success-certificate':
                return (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-100 p-4 rounded-lg text-sm text-green-800">
                            L'attestation de réussite utilise les données de l'étudiant (naissance, filière, mention). Indiquez l'année/session.
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Année universitaire</label>
                                <input type="text" value={formData.specific_details.academic_year} onChange={e => updateDetails('academic_year', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
                                <input type="text" value={formData.specific_details.session} onChange={e => updateDetails('session', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>
                    </div>
                );
            case 'transcript':
                return (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-sm text-yellow-800">
                            Le relevé de notes utilisera les notes présentes en base. Choisissez l'année et la session.
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Année universitaire</label>
                                <input type="text" value={formData.specific_details.academic_year} onChange={e => updateDetails('academic_year', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
                                <input type="text" value={formData.specific_details.session} onChange={e => updateDetails('session', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>
                    </div>
                );
            case 'internship':
                return (
                    <div className="space-y-4">
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg text-sm text-purple-800">
                            Convention de stage : renseignez l'entreprise, l'encadrant et la période.
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise</label>
                            <input type="text" value={formData.specific_details.company_name} onChange={e => updateDetails('company_name', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                            <input type="text" value={formData.specific_details.company_address} onChange={e => updateDetails('company_address', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input type="email" value={formData.specific_details.company_email} onChange={e => updateDetails('company_email', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                                <input type="text" value={formData.specific_details.company_phone} onChange={e => updateDetails('company_phone', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Encadrant</label>
                                <input type="text" value={formData.specific_details.supervisor_name} onChange={e => updateDetails('supervisor_name', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Fonction</label>
                                <input type="text" value={formData.specific_details.supervisor_role} onChange={e => updateDetails('supervisor_role', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sujet du stage</label>
                            <input type="text" value={formData.specific_details.internship_subject} onChange={e => updateDetails('internship_subject', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                                <input type="date" value={formData.specific_details.start_date} onChange={e => updateDetails('start_date', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                                <input type="date" value={formData.specific_details.end_date} onChange={e => updateDetails('end_date', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>
                    </div>
                );
            case 'reclamation':
                return (
                    <div className="space-y-4">
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg text-sm text-orange-800">
                            Réclamation : indiquez la référence de la demande concernée et le motif.
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Référence de la demande</label>
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
                                <option value="Retard">Retard de traitement</option>
                                <option value="Erreur">Informations incorrectes</option>
                                <option value="Autre">Autre</option>
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
                );
            default:
                return null;
        }
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
                                    Bonjour, <strong className="ml-1">{student.first_name} {student.last_name}</strong>. Identité vérifiée.
                                </div>
                            )}
                        </div>

                        <div className={`space-y-6 transition-opacity duration-500 ${student ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">2. Service demandé</h2>

                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quel document souhaitez-vous ?</label>
                                <select
                                    value={selection}
                                    onChange={(e) => setSelection(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium text-gray-800"
                                >
                                    <option value="">Choisissez une option...</option>
                                    <option value="school-certificate">Attestation de scolarité</option>
                                    <option value="success-certificate">Attestation de réussite</option>
                                    <option value="transcript">Relevé de notes</option>
                                    <option value="internship">Convention de stage</option>
                                    <option value="reclamation">Réclamation</option>
                                </select>
                            </div>

                            {renderSpecificFields()}

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={!selection || loading || !student}
                                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {loading ? 'Traitement...' : selection === 'reclamation' ? 'Envoyer la réclamation' : 'Soumettre la demande'}
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
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Réclamation envoyée</h2>
                                <p className="text-gray-600 mb-8">Nous avons bien reçu votre réclamation concernant la demande {formData.request_reference}.</p>
                                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 mb-8 max-w-md mx-auto">
                                    <p className="text-lg text-yellow-800 font-medium mb-2">Vérifiez votre email</p>
                                    <p className="text-gray-600">
                                        Nous avons envoyé un email de confirmation à <b>{formData.email}</b> contenant le numéro de réclamation.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
                                <p className="text-gray-600 mb-8">Référence envoyée par email. Un document provisoire a été généré automatiquement.</p>
                                <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 mb-8 max-w-md mx-auto">
                                    <p className="text-lg text-primary-800 font-medium mb-2">Vérifiez votre email</p>
                                    <p className="text-gray-600">
                                        Nous avons envoyé un email à <b>{student?.email}</b> contenant votre <b>référence</b>.
                                    </p>
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
