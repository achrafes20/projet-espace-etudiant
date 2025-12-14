
import React, { useEffect, useState } from 'react';
import { getRequests, updateRequestStatus, updateRequestDraft } from '../../services/api';
import { CheckIcon, XMarkIcon, ArrowPathIcon, DocumentMagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';

const parseDetails = (raw) => {
    if (!raw) return {};
    try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
        return {};
    }
};

// Fonction helper pour normaliser et comparer les statuts
const normalizeStatus = (status) => {
    if (!status) return '';
    // Convertir en string, enlever les espaces multiples, normaliser les accents
    return String(status)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Supprimer les diacritiques (accents)
};

const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 border border-gray-200';
    
    const statusStr = String(status).trim();
    const normalized = normalizeStatus(statusStr);
    
    // Vérifier "En attente" - toutes variantes possibles
    if (normalized.includes('attente') || 
        statusStr.toLowerCase().includes('attente') ||
        statusStr === 'En attente' || 
        statusStr === 'en attente' ||
        statusStr === 'En Attente') {
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    }
    
    // Vérifier "Accepté" ou "Accept" - toutes variantes possibles
    if (normalized.includes('accept') || 
        statusStr.toLowerCase().includes('accept') ||
        statusStr === 'Accepté' || 
        statusStr === 'Accept' ||
        statusStr === 'accepté' ||
        statusStr === 'accept' ||
        statusStr === 'ACCEPTÉ' ||
        statusStr === 'ACCEPT') {
        return 'bg-green-100 text-green-800 border border-green-200';
    }
    
    // Refusé, Refus, ou tout autre statut
    return 'bg-red-100 text-red-800 border border-red-200';
};

const isAccepted = (status) => {
    if (!status) return false;
    const statusStr = String(status).trim();
    const normalized = normalizeStatus(statusStr);
    return normalized.includes('accept') || 
           statusStr.toLowerCase().includes('accept') ||
           statusStr === 'Accepté' || 
           statusStr === 'Accept' ||
           statusStr === 'accepté' ||
           statusStr === 'accept';
};

const isPending = (status) => {
    if (!status) return false;
    const normalized = normalizeStatus(status);
    return normalized.includes('attente') || normalized === 'en attente' || normalized === 'enattente';
};
const RequestsList = () => {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState({ status: 'all', type: 'all', search: '' });
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [editableDetails, setEditableDetails] = useState({ modules: [] });
    const [modalState, setModalState] = useState({ mode: '', reason: '' });
    const [uploadFile, setUploadFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [draftLoading, setDraftLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const serverBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchRequests = async () => {
        try {
            const res = await getRequests(filter);
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const selectRequest = (req) => {
        setSelectedRequest(req);
        const details = parseDetails(req?.specific_details) || {};
        if (!details.modules) details.modules = [];
        setEditableDetails(details);
        setModalState({ mode: '', reason: '' });
        setUploadFile(null);
    };
    const handleSaveDraft = async () => {
        if (!selectedRequest) return;
        setDraftLoading(true);
        try {
            await updateRequestDraft(selectedRequest.id, { template_overrides: editableDetails });
            await fetchRequests();
        } catch (err) {
            alert('Impossible de régénérer le brouillon');
            console.error(err);
        } finally {
            setDraftLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        setLoading(true);
        const admin = JSON.parse(localStorage.getItem('admin'));
        const formData = new FormData();
        formData.append('status', 'Accepté');
        formData.append('admin_id', admin?.id || '');
        formData.append('template_overrides', JSON.stringify(editableDetails));
        if (uploadFile) formData.append('document', uploadFile);

        try {
            await updateRequestStatus(selectedRequest.id, formData);
            await fetchRequests();
            setModalState({ mode: '', reason: '' });
            setSelectedRequest(null);
        } catch (err) {
            alert('Validation impossible');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !modalState.reason) return;
        setLoading(true);
        const admin = JSON.parse(localStorage.getItem('admin'));
        const formData = new FormData();
        formData.append('status', 'Refusé');
        formData.append('refusal_reason', modalState.reason);
        formData.append('admin_id', admin?.id || '');
        formData.append('template_overrides', JSON.stringify(editableDetails));
        try {
            await updateRequestStatus(selectedRequest.id, formData);
            await fetchRequests();
            setModalState({ mode: '', reason: '' });
            setSelectedRequest(null);
        } catch (err) {
            alert('Refus impossible');
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedRequest(null);
        setModalState({ mode: '', reason: '' });
        setUploadFile(null);
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
    const renderEditableFields = () => {
        if (!selectedRequest) return null;
        const docType = selectedRequest.document_type;

        if (docType === 'transcript') {
            return (
                <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Année</label>
                            <input value={editableDetails.academic_year || ''} onChange={e => updateDetailField('academic_year', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Session</label>
                            <input value={editableDetails.session || ''} onChange={e => updateDetailField('session', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">Modules</p>
                        <button type="button" onClick={addModule} className="text-primary-600 text-xs font-semibold">+ Module</button>
                    </div>
                    {(editableDetails.modules || []).map((m, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-2 items-center">
                            <input value={m.name || ''} onChange={e => updateModule(idx, 'name', e.target.value)} className="col-span-2 border rounded px-2 py-1" />
                            <input value={m.grade || ''} onChange={e => updateModule(idx, 'grade', e.target.value)} className="border rounded px-2 py-1" placeholder="Note" />
                        </div>
                    ))}
                </div>
            );
        }

        if (docType === 'success-certificate') {
            return (
                <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Date naissance</label>
                            <input type="date" value={editableDetails.birth_date || ''} onChange={e => updateDetailField('birth_date', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Lieu</label>
                            <input value={editableDetails.birth_place || ''} onChange={e => updateDetailField('birth_place', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Filière</label>
                            <input value={editableDetails.filiere || ''} onChange={e => updateDetailField('filiere', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Session</label>
                            <input value={editableDetails.session || ''} onChange={e => updateDetailField('session', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Mention</label>
                        <input value={editableDetails.mention || ''} onChange={e => updateDetailField('mention', e.target.value)} className="w-full border rounded px-3 py-2" />
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

        return (
            <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Année</label>
                        <input value={editableDetails.academic_year || ''} onChange={e => updateDetailField('academic_year', e.target.value)} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Niveau</label>
                        <input value={editableDetails.level || ''} onChange={e => updateDetailField('level', e.target.value)} className="w-full border rounded px-3 py-2" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600">Programme</label>
                    <input value={editableDetails.program || ''} onChange={e => updateDetailField('program', e.target.value)} className="w-full border rounded px-3 py-2" />
                </div>
            </div>
        );
    };
    return (
        <div>
            <div className="mb-8 flex flex-col gap-2">
                <h1 className="page-title">Gestion des demandes</h1>
                <p className="page-subtitle">Vérifier, modifier les brouillons et valider ou refuser les demandes</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
                <div className="flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder="Rechercher (référence, nom, apogée)"
                        className="flex-1 min-w-[180px] px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                        value={filter.search}
                        onChange={e => setFilter({ ...filter, search: e.target.value })}
                    />
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
                        value={filter.status}
                        onChange={e => setFilter({ ...filter, status: e.target.value })}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="En attente">En attente</option>
                        <option value="Accepté">Accepté</option>
                        <option value="Refusé">Refusé</option>
                    </select>
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
                        value={filter.type}
                        onChange={e => setFilter({ ...filter, type: e.target.value })}
                    >
                        <option value="all">Tous les types</option>
                        <option value="school-certificate">Attestation de scolarité</option>
                        <option value="success-certificate">Attestation de réussite</option>
                        <option value="transcript">Relevé de notes</option>
                        <option value="internship">Convention de stage</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Référence</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Etudiant</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Type</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Statut</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-primary-600">{req.reference}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {req.first_name} {req.last_name}
                                    <div className="text-xs text-gray-500">Apogée: {req.apogee_number}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{req.document_type.replace('-', ' ')}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <button 
                                        onClick={() => selectRequest(req)} 
                                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                        title="Consulter"
                                    >
                                        <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                                        Consulter
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
                    <div 
                        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <DocumentMagnifyingGlassIcon className="h-6 w-6 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.reference}</h2>
                                    <p className="text-sm text-gray-600">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedRequest.status)}`}>
                                    {selectedRequest.status}
                                </span>
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XCircleIcon className="h-6 w-6 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Informations étudiant */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Informations étudiant</h3>
                                <div className="grid md:grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="font-semibold text-gray-700">Email :</span>
                                        <span className="ml-2 text-gray-600">{selectedRequest.email}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Apogée :</span>
                                        <span className="ml-2 text-gray-600">{selectedRequest.apogee_number}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Type de document :</span>
                                        <span className="ml-2 text-gray-600 capitalize">{selectedRequest.document_type.replace('-', ' ')}</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-3">
                                    {selectedRequest.generated_document_path && (
                                        <a
                                            href={`${serverBase}${selectedRequest.generated_document_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <ArrowPathIcon className="h-4 w-4" />
                                            Voir le brouillon généré
                                        </a>
                                    )}
                                    {selectedRequest.document_path && isAccepted(selectedRequest.status) && (
                                        <a
                                            href={`${serverBase}${selectedRequest.document_path}`}
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
                            <div className="border-2 border-gray-200 rounded-xl p-5 bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Champs éditables</h3>
                                    <button 
                                        onClick={handleSaveDraft} 
                                        disabled={draftLoading} 
                                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                                    >
                                        {draftLoading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                                        Sauvegarder le brouillon
                                    </button>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    {renderEditableFields()}
                                </div>
                            </div>

                            {/* Upload PDF */}
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 bg-gray-50">
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
                            {isPending(selectedRequest.status) && (
                                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                                    <button 
                                        onClick={handleApprove} 
                                        disabled={loading} 
                                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl flex items-center justify-center font-semibold shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? (
                                            <>
                                                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                                                Traitement...
                                            </>
                                        ) : (
                                            <>
                                                <CheckIcon className="h-5 w-5 mr-2" />
                                                Valider et envoyer
                                            </>
                                        )}
                                    </button>
                                    <div className="space-y-3">
                                        <textarea
                                            rows="3"
                                            placeholder="Motif du refus (obligatoire)"
                                            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                                            value={modalState.reason}
                                            onChange={e => setModalState({ ...modalState, reason: e.target.value })}
                                        ></textarea>
                                        <button 
                                            onClick={handleReject} 
                                            disabled={!modalState.reason || loading} 
                                            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-xl flex items-center justify-center font-semibold shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <XMarkIcon className="h-5 w-5 mr-2" />
                                            Refuser
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestsList;

