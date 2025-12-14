import React, { useEffect, useState } from 'react';
import { getComplaints, respondToComplaint, updateRequestStatus, updateRequestDraft } from '../../services/api';
import { CheckIcon, XMarkIcon, ArrowPathIcon, XCircleIcon } from '@heroicons/react/24/outline';

const parseDetails = (raw) => {
    if (!raw) return {};
    try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
        return {};
    }
};

const ComplaintsList = () => {
    const [complaints, setComplaints] = useState([]);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [requestLoading, setRequestLoading] = useState(false);
    const [draftLoading, setDraftLoading] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [requestModalState, setRequestModalState] = useState({ mode: '', reason: '' });
    const [editableDetails, setEditableDetails] = useState({});
    const [transcriptData, setTranscriptData] = useState(null);
    const [availableYears, setAvailableYears] = useState([]);
    const [availableSessions, setAvailableSessions] = useState([]);
    const serverBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await getComplaints();
            setComplaints(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRespond = async (includeDocument = false) => {
        try {
            const admin = JSON.parse(localStorage.getItem('admin'));
            const formData = new FormData();
            formData.append('response', responseText);
            formData.append('admin_id', admin?.id || '');
            formData.append('regenerate_document', includeDocument ? 'true' : 'false');
            
            if (includeDocument) {
                // Inclure les template_overrides pour régénérer le document
                formData.append('template_overrides', JSON.stringify(editableDetails));
                // Si un fichier est uploadé, l'inclure
                if (uploadFile) {
                    formData.append('document', uploadFile);
                }
            }

            await respondToComplaint(selectedComplaint.id, formData);
            setSelectedComplaint(null);
            setResponseText('');
            setUploadFile(null);
            // Refresh list
            fetchComplaints();
        } catch (err) {
            alert('Échec de l\'envoi de la réponse');
            console.error(err);
        }
    };

    useEffect(() => {
        if (selectedComplaint?.request_id) {
            const details = parseDetails(selectedComplaint.specific_details) || {};
            if (!details.modules) details.modules = [];
            
            // Initialiser les détails avec les données de l'étudiant
            const docType = selectedComplaint.document_type;
            if (docType === 'school-certificate') {
                details.level = details.level || selectedComplaint.level || '';
                details.program = details.program || selectedComplaint.filiere || selectedComplaint.major || '';
                if (!details.birth_date && selectedComplaint.birth_date) {
                    details.birth_date = selectedComplaint.birth_date.split('T')[0];
                }
            } else if (docType === 'transcript') {
                details.level = details.level || selectedComplaint.level || '';
                details.program = details.program || selectedComplaint.filiere || selectedComplaint.major || '';
            } else if (docType === 'success-certificate') {
                if (!details.birth_date && selectedComplaint.birth_date) {
                    details.birth_date = selectedComplaint.birth_date.split('T')[0];
                } else if (details.birth_date && typeof details.birth_date === 'string') {
                    details.birth_date = details.birth_date.split('T')[0];
                }
                details.birth_place = details.birth_place || selectedComplaint.birth_place || '';
                details.filiere = details.filiere || selectedComplaint.filiere || selectedComplaint.major || '';
            }
            
            setEditableDetails(details);
            
            // Charger les données de transcript
            if (selectedComplaint.transcript_data) {
                try {
                    const transcript = typeof selectedComplaint.transcript_data === 'string' 
                        ? JSON.parse(selectedComplaint.transcript_data) 
                        : selectedComplaint.transcript_data;
                    setTranscriptData(transcript);
                    
                    const years = (transcript.parcours || []).map(p => p.academic_year);
                    setAvailableYears(years);
                    
                    const selectedYear = details.academic_year || years[0];
                    const yearData = transcript.parcours?.find(p => p.academic_year === selectedYear);
                    const sessions = yearData?.semesters?.map(s => s.name) || [];
                    setAvailableSessions(sessions);
                    
                    if (docType === 'transcript' && selectedYear && details.session) {
                        loadModulesForYearAndSession(transcript, selectedYear, details.session);
                    } else if (docType === 'success-certificate' && selectedYear && details.session) {
                        loadMentionForYearAndSession(transcript, selectedYear, details.session);
                    }
                } catch (e) {
                    console.error('Error parsing transcript data:', e);
                    setTranscriptData(null);
                }
            } else {
                setTranscriptData(null);
            }
        }
    }, [selectedComplaint]);

    const loadModulesForYearAndSession = (transcript, academicYear, session) => {
        if (!transcript || !transcript.parcours) return;
        const yearData = transcript.parcours.find(p => p.academic_year === academicYear);
        if (!yearData || !yearData.semesters) return;
        const semesterData = yearData.semesters.find(s => s.name === session);
        if (semesterData && semesterData.modules) {
            const modules = semesterData.modules.map(m => ({
                name: m.name || m.module_name || '',
                grade: m.grade || m.note || ''
            }));
            setEditableDetails(prev => ({ ...prev, modules }));
        } else {
            setEditableDetails(prev => ({ ...prev, modules: [] }));
        }
    };

    const loadMentionForYearAndSession = (transcript, academicYear, session) => {
        if (!transcript || !transcript.parcours) return;
        const yearData = transcript.parcours.find(p => p.academic_year === academicYear);
        if (!yearData || !yearData.semesters) return;
        const semesterData = yearData.semesters.find(s => s.name === session);
        if (semesterData && semesterData.result) {
            setEditableDetails(prev => ({ 
                ...prev, 
                mention: semesterData.result.mention || prev.mention || ''
            }));
        }
    };

    const handleYearChange = (year) => {
        updateDetailField('academic_year', year);
        if (transcriptData) {
            const yearData = transcriptData.parcours?.find(p => p.academic_year === year);
            const sessions = yearData?.semesters?.map(s => s.name) || [];
            setAvailableSessions(sessions);
            
            if (selectedComplaint?.document_type === 'transcript') {
                if (sessions[0]) {
                    updateDetailField('session', sessions[0]);
                    loadModulesForYearAndSession(transcriptData, year, sessions[0]);
                }
            } else if (selectedComplaint?.document_type === 'success-certificate') {
                if (sessions[0]) {
                    updateDetailField('session', sessions[0]);
                    loadMentionForYearAndSession(transcriptData, year, sessions[0]);
                }
            } else if (sessions[0]) {
                updateDetailField('session', sessions[0]);
            }
        }
    };

    const handleSessionChange = (session) => {
        updateDetailField('session', session);
        if (transcriptData && editableDetails.academic_year) {
            if (selectedComplaint?.document_type === 'transcript') {
                loadModulesForYearAndSession(transcriptData, editableDetails.academic_year, session);
            } else if (selectedComplaint?.document_type === 'success-certificate') {
                loadMentionForYearAndSession(transcriptData, editableDetails.academic_year, session);
            }
        }
    };

    const updateDetailField = (key, value) => {
        setEditableDetails(prev => ({ ...prev, [key]: value }));
    };

    const updateModule = (index, key, value) => {
        const modules = editableDetails.modules ? [...editableDetails.modules] : [];
        modules[index] = { ...modules[index], [key]: value };
        updateDetailField('modules', modules);
    };

    const addModule = () => {
        const modules = editableDetails.modules ? [...editableDetails.modules] : [];
        modules.push({ name: `Module ${modules.length + 1}`, grade: '' });
        updateDetailField('modules', modules);
    };

    const handleSaveDraft = async () => {
        if (!selectedComplaint?.request_id) return;
        setDraftLoading(true);
        try {
            await updateRequestDraft(selectedComplaint.request_id, { template_overrides: editableDetails });
            await fetchComplaints();
        } catch (err) {
            alert('Impossible de régénérer le brouillon');
            console.error(err);
        } finally {
            setDraftLoading(false);
        }
    };

    const handleApproveRequest = async () => {
        if (!selectedComplaint?.request_id) return;
        setRequestLoading(true);
        const admin = JSON.parse(localStorage.getItem('admin'));
        const formData = new FormData();
        formData.append('status', 'Accepté');
        formData.append('admin_id', admin?.id || '');
        formData.append('template_overrides', JSON.stringify(editableDetails));
        if (uploadFile) formData.append('document', uploadFile);

        try {
            await updateRequestStatus(selectedComplaint.request_id, formData);
            await fetchComplaints();
            setRequestModalState({ mode: '', reason: '' });
            setUploadFile(null);
        } catch (err) {
            alert('Validation impossible');
        } finally {
            setRequestLoading(false);
        }
    };

    const handleRejectRequest = async () => {
        if (!selectedComplaint?.request_id || !requestModalState.reason) return;
        setRequestLoading(true);
        const admin = JSON.parse(localStorage.getItem('admin'));
        const formData = new FormData();
        formData.append('status', 'Refusé');
        formData.append('refusal_reason', requestModalState.reason);
        formData.append('admin_id', admin?.id || '');
        formData.append('template_overrides', JSON.stringify(editableDetails));
        try {
            await updateRequestStatus(selectedComplaint.request_id, formData);
            await fetchComplaints();
            setRequestModalState({ mode: '', reason: '' });
            setUploadFile(null);
        } catch (err) {
            alert('Refus impossible');
        } finally {
            setRequestLoading(false);
        }
    };

    const isPending = (status) => {
        if (!status) return false;
        const statusStr = String(status).trim().toLowerCase();
        return statusStr.includes('attente') || statusStr === 'en attente';
    };

    const renderEditableFields = () => {
        if (!selectedComplaint) return null;
        const docType = selectedComplaint.document_type;

        if (docType === 'transcript') {
            return (
                <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-xs text-yellow-800">
                        Les informations de l'étudiant sont chargées automatiquement. Vous pouvez les modifier si nécessaire.
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Année universitaire *</label>
                            <select 
                                value={editableDetails.academic_year || ''} 
                                onChange={e => handleYearChange(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            >
                                <option value="">Sélectionner une année</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Session *</label>
                            <select 
                                value={editableDetails.session || ''} 
                                onChange={e => handleSessionChange(e.target.value)}
                                disabled={!editableDetails.academic_year || availableSessions.length === 0}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Sélectionner une session</option>
                                {availableSessions.map(session => (
                                    <option key={session} value={session}>{session}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                        <h4 className="text-xs font-bold text-gray-700 mb-3">Informations de l'étudiant</h4>
                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Niveau</label>
                                <input 
                                    value={editableDetails.level || selectedComplaint?.level || ''} 
                                    onChange={e => updateDetailField('level', e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Programme / Filière</label>
                                <input 
                                    value={editableDetails.program || selectedComplaint?.filiere || selectedComplaint?.major || ''} 
                                    onChange={e => updateDetailField('program', e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-700">Modules</p>
                            <button 
                                type="button" 
                                onClick={addModule} 
                                className="px-3 py-1 bg-primary-50 hover:bg-primary-100 text-primary-600 text-xs font-semibold rounded-lg transition-colors"
                            >
                                + Ajouter un module
                            </button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {(editableDetails.modules || []).length === 0 ? (
                                <p className="text-xs text-gray-500 italic">Aucun module. Sélectionnez une année et une session pour charger les modules, ou ajoutez-en manuellement.</p>
                            ) : (
                                (editableDetails.modules || []).map((m, idx) => (
                                    <div key={idx} className="grid grid-cols-3 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                                        <input 
                                            value={m.name || ''} 
                                            onChange={e => updateModule(idx, 'name', e.target.value)} 
                                            className="col-span-2 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                            placeholder="Nom du module"
                                        />
                                        <div className="flex gap-1">
                                            <input 
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="20"
                                                value={m.grade || ''} 
                                                onChange={e => updateModule(idx, 'grade', e.target.value)} 
                                                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                                placeholder="Note"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const modules = editableDetails.modules.filter((_, i) => i !== idx);
                                                    updateDetailField('modules', modules);
                                                }}
                                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        if (docType === 'success-certificate') {
            return (
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-100 p-3 rounded-lg text-xs text-green-800">
                        Les informations de l'étudiant sont chargées automatiquement. Vous pouvez les modifier si nécessaire.
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Année universitaire *</label>
                            <select 
                                value={editableDetails.academic_year || ''} 
                                onChange={e => handleYearChange(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            >
                                <option value="">Sélectionner une année</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Session *</label>
                            <select 
                                value={editableDetails.session || ''} 
                                onChange={e => handleSessionChange(e.target.value)}
                                disabled={!editableDetails.academic_year || availableSessions.length === 0}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Sélectionner une session</option>
                                {availableSessions.map(session => (
                                    <option key={session} value={session}>{session}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                        <h4 className="text-xs font-bold text-gray-700 mb-3">Informations de l'étudiant</h4>
                        <div className="grid md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Date de naissance</label>
                                <input 
                                    type="date" 
                                    value={editableDetails.birth_date || ''} 
                                    onChange={e => updateDetailField('birth_date', e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Lieu de naissance</label>
                                <input 
                                    value={editableDetails.birth_place || selectedComplaint?.birth_place || ''} 
                                    onChange={e => updateDetailField('birth_place', e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 mt-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Filière</label>
                                <input 
                                    value={editableDetails.filiere || selectedComplaint?.filiere || selectedComplaint?.major || ''} 
                                    onChange={e => updateDetailField('filiere', e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Mention</label>
                                <input 
                                    value={editableDetails.mention || ''} 
                                    onChange={e => updateDetailField('mention', e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-green-50" 
                                    placeholder="Chargée automatiquement depuis le relevé"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (docType === 'school-certificate') {
            return (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800">
                        Les informations de l'étudiant sont chargées automatiquement. Vous pouvez les modifier si nécessaire.
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Année universitaire *</label>
                            <select 
                                value={editableDetails.academic_year || ''} 
                                onChange={e => handleYearChange(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            >
                                <option value="">Sélectionner une année</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                        <h4 className="text-xs font-bold text-gray-700 mb-3">Informations de l'étudiant</h4>
                        <div className="grid md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Date de naissance</label>
                                <input 
                                    type="date" 
                                    value={editableDetails.birth_date || (selectedComplaint?.birth_date ? selectedComplaint.birth_date.split('T')[0] : '') || ''} 
                                    onChange={e => updateDetailField('birth_date', e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Niveau</label>
                                <input 
                                    value={editableDetails.level || selectedComplaint?.level || ''} 
                                    onChange={e => updateDetailField('level', e.target.value)} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                />
                            </div>
                        </div>
                        <div className="mt-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Programme / Filière</label>
                            <input 
                                value={editableDetails.program || selectedComplaint?.filiere || selectedComplaint?.major || ''} 
                                onChange={e => updateDetailField('program', e.target.value)} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                            />
                        </div>
                    </div>
                </div>
            );
        }

        if (docType === 'internship') {
            return (
                <div className="space-y-3">
                    <div className="text-xs font-bold text-gray-700 mb-2">Informations entreprise</div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Raison sociale *</label>
                        <input value={editableDetails.company_legal_name || editableDetails.company_name || ''} onChange={e => updateDetailField('company_legal_name', e.target.value)} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Adresse *</label>
                        <input value={editableDetails.company_address || ''} onChange={e => updateDetailField('company_address', e.target.value)} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Ville *</label>
                            <input value={editableDetails.company_city || ''} onChange={e => updateDetailField('company_city', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Téléphone *</label>
                            <input value={editableDetails.company_phone || ''} onChange={e => updateDetailField('company_phone', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Email *</label>
                            <input value={editableDetails.company_email || ''} onChange={e => updateDetailField('company_email', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Secteur *</label>
                            <input value={editableDetails.company_sector || ''} onChange={e => updateDetailField('company_sector', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                    
                    <div className="text-xs font-bold text-gray-700 mt-4 mb-2">Représentant entreprise</div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Nom *</label>
                            <input value={editableDetails.company_representative_name || ''} onChange={e => updateDetailField('company_representative_name', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Fonction *</label>
                            <input value={editableDetails.company_representative_function || ''} onChange={e => updateDetailField('company_representative_function', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                    
                    <div className="text-xs font-bold text-gray-700 mt-4 mb-2">Encadrant entreprise</div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Nom *</label>
                            <input value={editableDetails.supervisor_name || ''} onChange={e => updateDetailField('supervisor_name', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Fonction *</label>
                            <input value={editableDetails.supervisor_role || ''} onChange={e => updateDetailField('supervisor_role', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Téléphone *</label>
                            <input value={editableDetails.supervisor_phone || ''} onChange={e => updateDetailField('supervisor_phone', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Email *</label>
                            <input value={editableDetails.supervisor_email || ''} onChange={e => updateDetailField('supervisor_email', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                    
                    <div className="text-xs font-bold text-gray-700 mt-4 mb-2">Encadrant ENSA</div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Nom *</label>
                        <input value={editableDetails.ensa_supervisor_name || ''} onChange={e => updateDetailField('ensa_supervisor_name', e.target.value)} className="w-full border rounded px-3 py-2" />
                    </div>
                    
                    <div className="text-xs font-bold text-gray-700 mt-4 mb-2">Informations stage</div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Sujet *</label>
                        <input value={editableDetails.internship_subject || ''} onChange={e => updateDetailField('internship_subject', e.target.value)} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Stage du *</label>
                            <input type="date" value={editableDetails.start_date || ''} onChange={e => updateDetailField('start_date', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Stage au *</label>
                            <input type="date" value={editableDetails.end_date || ''} onChange={e => updateDetailField('end_date', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="page-title">Gestion des réclamations</h1>
                <p className="page-subtitle">Consultez et répondez aux réclamations des étudiants</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Réclamation #</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Étudiant</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Ref. Demande</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Motif</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Statut</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {complaints.map((comp) => (
                            <tr key={comp.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-red-600">{comp.complaint_number}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{comp.first_name} {comp.last_name}</td>
                                <td className="px-6 py-4 text-sm text-blue-600">{comp.request_reference}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{comp.reason}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${comp.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {comp.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <button
                                        onClick={() => setSelectedComplaint(comp)}
                                        className="text-primary-600 hover:text-primary-800 font-medium text-xs"
                                    >
                                        Voir / Répondre
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Response Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Réclamation {selectedComplaint.complaint_number}</h2>
                                <p className="text-sm text-gray-600">Demande : {selectedComplaint.request_reference}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedComplaint(null);
                                    setResponseText('');
                                    setRequestModalState({ mode: '', reason: '' });
                                    setUploadFile(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XCircleIcon className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Section Réclamation */}
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Détails de la réclamation</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-semibold text-gray-700">Motif :</span>
                                        <span className="ml-2 text-gray-600">{selectedComplaint.reason}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Description :</span>
                                        <p className="mt-1 text-gray-600">{selectedComplaint.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section Traitement de la demande */}
                            <div className="border-2 border-gray-200 rounded-xl p-5 bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Traitement de la demande</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        selectedComplaint.request_status === 'En attente' 
                                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                            : selectedComplaint.request_status === 'Accepté'
                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                            : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                        {selectedComplaint.request_status}
                                    </span>
                                </div>

                                {/* Informations de la demande */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="font-semibold text-gray-700">Type de document :</span>
                                            <span className="ml-2 text-gray-600 capitalize">{selectedComplaint.document_type?.replace('-', ' ')}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Référence :</span>
                                            <span className="ml-2 text-gray-600">{selectedComplaint.request_reference}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-3">
                                        {selectedComplaint.generated_document_path && (
                                            <a
                                                href={`${serverBase}${selectedComplaint.generated_document_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <ArrowPathIcon className="h-4 w-4" />
                                                Voir le brouillon généré
                                            </a>
                                        )}
                                        {selectedComplaint.document_path && selectedComplaint.request_status === 'Accepté' && (
                                            <a
                                                href={`${serverBase}${selectedComplaint.document_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Document final envoyé
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Champs éditables */}
                                <div className="border-2 border-gray-200 rounded-xl p-5 bg-white mb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">Champs éditables</h3>
                                        <button 
                                            onClick={handleSaveDraft} 
                                            disabled={draftLoading} 
                                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                                        >
                                            {draftLoading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                                            Sauvegarder et régénérer le brouillon
                                        </button>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        {renderEditableFields()}
                                    </div>
                                </div>

                                {/* Upload PDF */}
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 bg-gray-50 mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Remplacer le PDF (optionnel)</label>
                                    <input 
                                        type="file" 
                                        accept="application/pdf" 
                                        onChange={e => setUploadFile(e.target.files[0])}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                                    />
                                    {uploadFile && (
                                        <p className="mt-2 text-sm text-green-600 font-medium">✓ Fichier sélectionné : {uploadFile.name}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                {isPending(selectedComplaint.request_status) && (
                                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                                            <button 
                                                onClick={handleApproveRequest} 
                                                disabled={requestLoading} 
                                                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl flex items-center justify-center font-semibold shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {requestLoading ? (
                                                    <>
                                                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                                                        Traitement...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckIcon className="h-5 w-5 mr-2" />
                                                        Valider et envoyer la demande
                                                    </>
                                                )}
                                            </button>
                                            <div className="space-y-3">
                                                <textarea
                                                    rows="3"
                                                    placeholder="Motif du refus (obligatoire)"
                                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                                                    value={requestModalState.reason}
                                                    onChange={e => setRequestModalState({ ...requestModalState, reason: e.target.value })}
                                                ></textarea>
                                                <button 
                                                    onClick={handleRejectRequest} 
                                                    disabled={!requestModalState.reason || requestLoading} 
                                                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-xl flex items-center justify-center font-semibold shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    <XMarkIcon className="h-5 w-5 mr-2" />
                                                    Refuser la demande
                                                </button>
                                            </div>
                                        </div>
                                )}
                                
                                {/* Bouton pour régénérer même si déjà traité */}
                                {!isPending(selectedComplaint.request_status) && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                                        <p className="text-sm text-blue-800 mb-3">
                                            Cette demande a déjà été traitée. Vous pouvez modifier les champs ci-dessus et régénérer le document en cliquant sur "Sauvegarder et régénérer le brouillon".
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Section Réponse à la réclamation */}
                            <div className="border-2 border-gray-200 rounded-xl p-5 bg-white">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Répondre à la réclamation</h3>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Réponse</label>
                                <textarea
                                    rows="4"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none mb-4"
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Rédigez votre réponse..."
                                ></textarea>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                    <p className="text-xs text-blue-800">
                                        <strong>Note :</strong> Vous pouvez envoyer uniquement la réponse, ou inclure le nouveau document corrigé généré à partir des champs éditables ci-dessus.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => handleRespond(false)}
                                        disabled={!responseText.trim()}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Envoyer seulement la réponse
                                    </button>
                                    <button
                                        onClick={() => handleRespond(true)}
                                        disabled={!responseText.trim()}
                                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        <ArrowPathIcon className="h-4 w-4" />
                                        Envoyer réponse + nouveau document
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintsList;
