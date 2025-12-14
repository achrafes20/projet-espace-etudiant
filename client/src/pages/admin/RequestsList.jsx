
import React, { useEffect, useState } from 'react';
import { getRequests, updateRequestStatus, updateRequestDraft } from '../../services/api';
import { CheckIcon, XMarkIcon, ArrowPathIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

const parseDetails = (raw) => {
    if (!raw) return {};
    try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
        return {};
    }
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
            if (res.data.length && !selectedRequest) {
                selectRequest(res.data[0]);
            } else if (selectedRequest) {
                const refreshed = res.data.find(r => r.id === selectedRequest.id);
                if (refreshed) selectRequest(refreshed);
            }
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
        } catch (err) {
            alert('Refus impossible');
        } finally {
            setLoading(false);
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
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Entreprise</label>
                        <input value={editableDetails.company_name || ''} onChange={e => updateDetailField('company_name', e.target.value)} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Adresse</label>
                        <input value={editableDetails.company_address || ''} onChange={e => updateDetailField('company_address', e.target.value)} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Email</label>
                            <input value={editableDetails.company_email || ''} onChange={e => updateDetailField('company_email', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Téléphone</label>
                            <input value={editableDetails.company_phone || ''} onChange={e => updateDetailField('company_phone', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Encadrant</label>
                            <input value={editableDetails.supervisor_name || ''} onChange={e => updateDetailField('supervisor_name', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Fonction</label>
                            <input value={editableDetails.supervisor_role || ''} onChange={e => updateDetailField('supervisor_role', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Sujet</label>
                        <input value={editableDetails.internship_subject || ''} onChange={e => updateDetailField('internship_subject', e.target.value)} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Début</label>
                            <input type="date" value={editableDetails.start_date || ''} onChange={e => updateDetailField('start_date', e.target.value)} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600">Fin</label>
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
                <h1 className="text-3xl font-bold text-gray-900">Gestion des demandes</h1>
                <p className="text-gray-600">Vérifier, modifier les brouillons et valider ou refuser.</p>
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

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                                <tr key={req.id} className={`hover:bg-gray-50 transition-colors ${selectedRequest?.id === req.id ? 'bg-primary-50/30' : ''}`}>
                                    <td className="px-6 py-4 text-sm font-medium text-primary-600">{req.reference}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {req.first_name} {req.last_name}
                                        <div className="text-xs text-gray-500">Apogée: {req.apogee_number}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{req.document_type.replace('-', ' ')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${req.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                                            req.status === 'Accepté' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{req.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex space-x-2">
                                            <button onClick={() => selectRequest(req)} className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="Consulter">
                                                <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
                    {selectedRequest ? (
                        <>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">Référence</p>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedRequest.reference}</h3>
                                    <p className="text-sm text-gray-600">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedRequest.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                                    selectedRequest.status === 'Accepté' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{selectedRequest.status}</span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-700">
                                <p><span className="font-semibold">Email :</span> {selectedRequest.email}</p>
                                <p><span className="font-semibold">Apogée :</span> {selectedRequest.apogee_number}</p>
                                <p><span className="font-semibold">Type :</span> {selectedRequest.document_type.replace('-', ' ')}</p>
                                {selectedRequest.generated_document_path && (
                                    <a
                                        href={`${serverBase}${selectedRequest.generated_document_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary-600 text-sm font-semibold inline-flex items-center"
                                    >
                                        Voir le brouillon généré
                                        <ArrowPathIcon className="h-4 w-4 ml-1" />
                                    </a>
                                )}
                                {selectedRequest.document_path && selectedRequest.status === 'Accepté' && (
                                    <a
                                        href={`${serverBase}${selectedRequest.document_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-green-600 text-sm font-semibold inline-flex items-center"
                                    >
                                        Document final envoyé
                                    </a>
                                )}
                            </div>

                            <div className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-gray-900">Champs éditables</h4>
                                    <button onClick={handleSaveDraft} disabled={draftLoading} className="text-xs text-primary-600 font-semibold flex items-center">
                                        {draftLoading && <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />} Sauvegarder le brouillon
                                    </button>
                                </div>
                                {renderEditableFields()}
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-gray-600">Remplacer le PDF (optionnel)</label>
                                <input type="file" accept="application/pdf" onChange={e => setUploadFile(e.target.files[0])} />
                            </div>

                            {selectedRequest.status === 'En attente' && (
                                <div className="flex flex-col gap-2">
                                    <button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center font-semibold">
                                        {loading ? 'Traitement...' : 'Valider et envoyer'} <CheckIcon className="h-5 w-5 ml-2" />
                                    </button>
                                    <div className="space-y-2">
                                        <textarea
                                            rows="2"
                                            placeholder="Motif du refus"
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={modalState.reason}
                                            onChange={e => setModalState({ ...modalState, reason: e.target.value })}
                                        ></textarea>
                                        <button onClick={handleReject} disabled={!modalState.reason || loading} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center font-semibold">
                                            Refuser <XMarkIcon className="h-5 w-5 ml-2" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">Sélectionnez une demande pour consulter le détail.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestsList;
