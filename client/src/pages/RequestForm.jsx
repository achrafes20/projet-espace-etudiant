
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, PlusIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { validateStudent, createRequest, createComplaint, checkField } from '../services/api';
import Header from '../components/Header';

const baseDetails = {
    academic_year: '2024/2025',
    session: 'Session 1',
    // Informations entreprise
    company_name: '',
    company_legal_name: '',
    company_address: '',
    company_city: '',
    company_email: '',
    company_phone: '',
    company_sector: '',
    // Représentant entreprise
    company_representative_name: '',
    company_representative_function: '',
    // Encadrant entreprise
    supervisor_name: '',
    supervisor_role: '',
    supervisor_phone: '',
    supervisor_email: '',
    // Encadrant ENSA
    ensa_supervisor_name: '',
    // Stage
    internship_subject: '',
    start_date: '',
    end_date: ''
};

const createDefaultDetails = () => ({ ...baseDetails });

const RequestForm = () => {
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [selection, setSelection] = useState('');
    const [yearOptions, setYearOptions] = useState([]);
    const [sessionOptions, setSessionOptions] = useState([]);
    const [transcriptData, setTranscriptData] = useState({});

    const [formData, setFormData] = useState({
        email: '',
        apogee_number: '',
        cin: '',
        cne: '',
        specific_details: createDefaultDetails(),
        request_reference: '',
        reason: '',
        description: ''
    });

    const [fieldStatus, setFieldStatus] = useState({
        email: 'neutral',
        apogee_number: 'neutral',
        cin_cne: 'neutral'
    });

    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [identityError, setIdentityError] = useState('');
    const [validationError, setValidationError] = useState('');
    const [submitError, setSubmitError] = useState('');
    
    const handleBlur = async (field) => {
        if (field === 'cin_cne') {
            const value = formData.cin || formData.cne;
            if (!value) {
                setFieldStatus(prev => ({ ...prev, [field]: 'neutral' }));
                return;
            }
            setFieldStatus(prev => ({ ...prev, [field]: 'loading' }));
            try {
                // Essayer d'abord avec CIN
                let res = await checkField({ field: 'cin', value });
                if (res.data.exists) {
                    setFormData(prev => ({ ...prev, cin: value, cne: '' }));
                    setFieldStatus(prev => ({ ...prev, [field]: 'valid' }));
                    return;
                }
                // Si CIN n'existe pas, essayer avec CNE
                res = await checkField({ field: 'cne', value });
                if (res.data.exists) {
                    setFormData(prev => ({ ...prev, cne: value, cin: '' }));
                    setFieldStatus(prev => ({ ...prev, [field]: 'valid' }));
                    return;
                }
                // Aucun des deux n'existe
                setFieldStatus(prev => ({ ...prev, [field]: 'invalid' }));
            } catch (error) {
                setFieldStatus(prev => ({ ...prev, [field]: 'invalid' }));
            }
        } else {
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
        }
    };

    useEffect(() => {
        const verifyIdentity = async () => {
            if (fieldStatus.email === 'valid' && fieldStatus.apogee_number === 'valid' && fieldStatus.cin_cne === 'valid') {
                try {
                    const res = await validateStudent({
                        email: formData.email,
                        apogee_number: formData.apogee_number,
                        cin: formData.cin || undefined,
                        cne: formData.cne || undefined
                    });
                    if (res.data.valid) {
                        setStudent(res.data.student);
                        const parsed = (() => {
                            try {
                                return typeof res.data.student.transcript_data === 'string'
                                    ? JSON.parse(res.data.student.transcript_data)
                                    : res.data.student.transcript_data || {};
                            } catch {
                                return {};
                            }
                        })();
                        setTranscriptData(parsed);
                        const years = (parsed.parcours || []).map(p => p.academic_year);
                        setYearOptions(years);
                        setSessionOptions(parsed.parcours?.[0]?.semesters?.map(s => s.name) || []);
                        setFormData(prev => ({
                            ...prev,
                            specific_details: { ...prev.specific_details, academic_year: years[0] || prev.specific_details.academic_year, session: (parsed.parcours?.[0]?.semesters?.[0]?.name) || prev.specific_details.session }
                        }));
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
    }, [fieldStatus, formData.email, formData.apogee_number, formData.cin, formData.cne]);

    const getIcon = (status) => {
        if (status === 'loading') return <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full" />;
        if (status === 'valid') return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
        if (status === 'invalid') return <XCircleIcon className="h-6 w-6 text-red-500" />;
        return null;
    };

    const updateDetails = (key, value) => {
        setFormData(prev => ({
            ...prev,
            specific_details: { ...prev.specific_details, [key]: value }
        }));
    };

    const validateInternshipFields = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^0[567]\d{8}$/;
        const requiredFields = [
            'company_legal_name',
            'company_address',
            'company_city',
            'company_email',
            'company_phone',
            'company_sector',
            'company_representative_name',
            'company_representative_function',
            'supervisor_name',
            'supervisor_role',
            'supervisor_phone',
            'supervisor_email',
            'ensa_supervisor_name',
            'internship_subject',
            'start_date',
            'end_date'
        ];

        for (const key of requiredFields) {
            if (!formData.specific_details[key] || String(formData.specific_details[key]).trim() === '') {
                return 'Tous les champs marqués * sont obligatoires.';
            }
        }

        const { company_email, supervisor_email, company_phone, supervisor_phone, start_date, end_date } = formData.specific_details;

        if (!emailRegex.test(company_email)) {
            return "Email de l’entreprise invalide.";
        }
        if (!emailRegex.test(supervisor_email)) {
            return "Email de l’encadrant invalide.";
        }
        if (!phoneRegex.test(company_phone) || !phoneRegex.test(supervisor_phone)) {
            return 'Les numéros de téléphone doivent contenir 10 chiffres et commencer par 05, 06 ou 07.';
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(start_date);
        const end = new Date(end_date);

        if (start < today) {
            return 'La date de début ne peut pas être dans le passé.';
        }
        if (end <= start) {
            return 'La date de fin doit être postérieure à la date de début.';
        }
        return '';
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            setValidationError('');
            setSubmitError('');
            if (selection === 'internship') {
                const internshipError = validateInternshipFields();
                if (internshipError) {
                    setValidationError(internshipError);
                    setLoading(false);
                    return;
                }
            }
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
            setSubmitError(err.userMessage || 'Une erreur est survenue, merci de réessayer sans recharger la page.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!student) return;
        if (!formData.specific_details.academic_year) return;
        const parcours = transcriptData.parcours || [];
        const found = parcours.find(p => p.academic_year === formData.specific_details.academic_year);
        if (found && found.semesters) {
            setSessionOptions(found.semesters.map(s => s.name));
            if (!found.semesters.find(s => s.name === formData.specific_details.session)) {
                setFormData(prev => ({ ...prev, specific_details: { ...prev.specific_details, session: found.semesters[0]?.name || '' } }));
            }
        }
    }, [formData.specific_details.academic_year, student, transcriptData]);

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
                            <select value={formData.specific_details.academic_year} onChange={e => updateDetails('academic_year', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="">Sélectionner...</option>
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
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
                                <select value={formData.specific_details.academic_year} onChange={e => updateDetails('academic_year', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="">Sélectionner...</option>
                                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
                                <select value={formData.specific_details.session} onChange={e => updateDetails('session', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="">Sélectionner...</option>
                                    {sessionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
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
                                <select value={formData.specific_details.academic_year} onChange={e => updateDetails('academic_year', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="">Sélectionner...</option>
                                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
                                <select value={formData.specific_details.session} onChange={e => updateDetails('session', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="">Sélectionner...</option>
                                    {sessionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'internship':
                return (
                    <div className="space-y-4">
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg text-sm text-purple-800">
                            Convention de stage : renseignez toutes les informations demandées.
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de l'entreprise</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Raison sociale de l'entreprise *</label>
                                    <input type="text" value={formData.specific_details.company_legal_name} onChange={e => updateDetails('company_legal_name', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse de l'entreprise *</label>
                                    <input type="text" value={formData.specific_details.company_address} onChange={e => updateDetails('company_address', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ville de l'entreprise *</label>
                                        <input type="text" value={formData.specific_details.company_city} onChange={e => updateDetails('company_city', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone de l'entreprise *</label>
                                        <input type="text" value={formData.specific_details.company_phone} onChange={e => updateDetails('company_phone', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email de l'entreprise *</label>
                                        <input type="email" value={formData.specific_details.company_email} onChange={e => updateDetails('company_email', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Secteur de l'entreprise *</label>
                                        <input type="text" value={formData.specific_details.company_sector} onChange={e => updateDetails('company_sector', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Représentant de l'entreprise</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom du représentant *</label>
                                    <input type="text" value={formData.specific_details.company_representative_name} onChange={e => updateDetails('company_representative_name', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Fonction du représentant *</label>
                                    <input type="text" value={formData.specific_details.company_representative_function} onChange={e => updateDetails('company_representative_function', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Encadrant de l'entreprise</h3>
                            <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'encadrant *</label>
                                        <input type="text" value={formData.specific_details.supervisor_name} onChange={e => updateDetails('supervisor_name', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Fonction de l'encadrant *</label>
                                        <input type="text" value={formData.specific_details.supervisor_role} onChange={e => updateDetails('supervisor_role', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone de l'encadrant *</label>
                                        <input type="text" value={formData.specific_details.supervisor_phone} onChange={e => updateDetails('supervisor_phone', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email de l'encadrant *</label>
                                        <input type="email" value={formData.specific_details.supervisor_email} onChange={e => updateDetails('supervisor_email', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Encadrant ENSA</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'encadrant ENSA *</label>
                                <input type="text" value={formData.specific_details.ensa_supervisor_name} onChange={e => updateDetails('ensa_supervisor_name', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du stage</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sujet du stage *</label>
                                    <input type="text" value={formData.specific_details.internship_subject} onChange={e => updateDetails('internship_subject', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Stage du *</label>
                                        <input type="date" value={formData.specific_details.start_date} onChange={e => updateDetails('start_date', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Stage au *</label>
                                        <input type="date" value={formData.specific_details.end_date} onChange={e => updateDetails('end_date', e.target.value)} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" required />
                                    </div>
                                </div>
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
        <div className="min-h-screen flex flex-col bg-hero">
            <Header />
            <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
                <button onClick={() => navigate('/')} className="text-primary-800 hover:text-primary-900 font-semibold mb-8 flex items-center transition-colors">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" /> Retour au Portail
                </button>

                {!successData ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-glass space-y-8"
                    >
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">1. Identification</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        className={`input-field pr-12 ${fieldStatus.email === 'invalid' ? 'ring-2 ring-red-200 border-red-200' : ''}`}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        onBlur={() => handleBlur('email')}
                                        placeholder="etudiant@university.edu"
                                    />
                                    <div className="absolute right-3 top-3">
                                        {getIcon(fieldStatus.email)}
                                    </div>
                                </div>
                                {fieldStatus.email === 'invalid' && <p className="text-red-600 text-sm mt-2">Email introuvable.</p>}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Code Apogée</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className={`input-field pr-12 ${fieldStatus.apogee_number === 'invalid' ? 'ring-2 ring-red-200 border-red-200' : ''}`}
                                            value={formData.apogee_number}
                                            onChange={e => setFormData({ ...formData, apogee_number: e.target.value })}
                                            onBlur={() => handleBlur('apogee_number')}
                                            placeholder="12345678"
                                        />
                                        <div className="absolute right-3 top-3">
                                            {getIcon(fieldStatus.apogee_number)}
                                        </div>
                                    </div>
                                    {fieldStatus.apogee_number === 'invalid' && <p className="text-red-600 text-sm mt-2">Code incorrect.</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">CNE / CIN</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className={`input-field pr-12 ${fieldStatus.cin_cne === 'invalid' ? 'ring-2 ring-red-200 border-red-200' : ''}`}
                                            value={formData.cin || formData.cne}
                                            onChange={e => {
                                                const value = e.target.value;
                                                // Si la valeur commence par des lettres (format CNE), utiliser cne, sinon cin
                                                if (/^[A-Za-z]/.test(value)) {
                                                    setFormData({ ...formData, cne: value, cin: '' });
                                                } else {
                                                    setFormData({ ...formData, cin: value, cne: '' });
                                                }
                                            }}
                                            onBlur={() => handleBlur('cin_cne')}
                                            placeholder="CNE ou CIN"
                                        />
                                        <div className="absolute right-3 top-3">
                                            {getIcon(fieldStatus.cin_cne)}
                                        </div>
                                    </div>
                                    {fieldStatus.cin_cne === 'invalid' && <p className="text-red-600 text-sm mt-2">CNE ou CIN incorrect.</p>}
                                </div>
                            </div>

                            {identityError && (
                                <div className="bg-red-50/70 border border-red-100 text-red-700 px-4 py-3 rounded-xl font-semibold">
                                    {identityError}
                                </div>
                            )}

                            {student && !identityError && (
                                <div className="bg-green-50/70 border border-green-100 text-green-800 px-4 py-3 rounded-xl flex items-center">
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
                                    className="input-field bg-white/70 font-semibold text-gray-800"
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
                                {validationError && (
                                    <div className="text-red-700 text-sm font-semibold mr-4">{validationError}</div>
                                )}
                                {submitError && (
                                    <div className="text-red-700 text-sm font-semibold mr-4">{submitError}</div>
                                )}
                                <button
                                    onClick={handleSubmit}
                                    disabled={!selection || loading || !student}
                                    className="btn-primary px-8 disabled:opacity-50 disabled:shadow-none"
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
                        className="card-glass text-center"
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-success-500 to-primary-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/20 ring-1 ring-white/40">
                            <CheckCircleIcon className="h-12 w-12 text-white" />
                        </div>

                        {successData.type === 'complaint' ? (
                            <>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Réclamation envoyée</h2>
                                <p className="text-gray-600 mb-8">Nous avons bien reçu votre réclamation concernant la demande {formData.request_reference}.</p>
                                <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-6 mb-8 max-w-md mx-auto">
                                    <p className="text-lg text-orange-800 font-semibold mb-2">Vérifiez votre email</p>
                                    <p className="text-gray-600">
                                        Nous avons envoyé un email de confirmation à <b>{formData.email}</b> contenant le numéro de réclamation.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
                                <p className="text-gray-600 mb-8">Référence envoyée par email. Un document provisoire a été généré automatiquement.</p>
                                <div className="bg-primary-50/70 border border-primary-100 rounded-2xl p-6 mb-8 max-w-md mx-auto">
                                    <p className="text-lg text-primary-800 font-semibold mb-2">Vérifiez votre email</p>
                                    <p className="text-gray-600">
                                        Nous avons envoyé un email à <b>{student?.email}</b> contenant votre <b>référence</b>.
                                    </p>
                                </div>
                            </>
                        )}
                        <button onClick={() => navigate('/')} className="btn-secondary">
                            Retour au Portail
                        </button>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default RequestForm;
