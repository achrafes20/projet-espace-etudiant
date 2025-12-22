import React, { useEffect, useState } from 'react';
import { getRequests, updateRequestStatus } from '../../services/api';
import { CheckIcon, XMarkIcon, DocumentMagnifyingGlassIcon, XCircleIcon, MagnifyingGlassIcon, FunnelIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const DOC_TYPE_LABELS = {
    'school-certificate': 'Attestation de scolarité',
    'success-certificate': 'Attestation de réussite',
    'transcript': 'Relevé de notes',
    'internship': 'Convention de stage'
};

const formatDocType = (docType) => DOC_TYPE_LABELS[docType] || docType;

const getStatusColor = (status) => {
    if (!status) return 'bg-slate-100 text-slate-800 border-slate-200';
    const statusStr = String(status).trim().toLowerCase();
    if (statusStr.includes('attente')) return 'bg-amber-50 text-amber-700 border-amber-200/50';
    if (statusStr.includes('accept')) return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
    return 'bg-rose-50 text-rose-700 border-rose-200/50';
};

const RequestsList = () => {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalMode, setModalMode] = useState(''); // 'view', 'accept', 'reject'
    const [refusalReason, setRefusalReason] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const serverBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [requests, activeTab, searchTerm]);

    const fetchRequests = async () => {
        try {
            const res = await getRequests({ status: 'En attente' });
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const applyFilters = () => {
        let filtered = [...requests];

        // Filter by document type (tab)
        if (activeTab !== 'all') {
            filtered = filtered.filter(req => req.document_type === activeTab);
        }

        // Filter by search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(req =>
                req.reference?.toLowerCase().includes(searchLower) ||
                req.first_name?.toLowerCase().includes(searchLower) ||
                req.last_name?.toLowerCase().includes(searchLower) ||
                req.apogee_number?.toLowerCase().includes(searchLower) ||
                req.email?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredRequests(filtered);
    };

    const handleViewDocument = (req) => {
        setSelectedRequest(req);
        setModalMode('view');
        setRefusalReason('');
        setUploadFile(null);
    };

    const handleAccept = async () => {
        if (!selectedRequest) return;
        setLoading(true);
        const admin = JSON.parse(localStorage.getItem('admin'));
        const formData = new FormData();
        formData.append('status', 'Accepté');
        formData.append('admin_id', admin?.id || '');
        formData.append('template_overrides', JSON.stringify({}));
        if (uploadFile) formData.append('document', uploadFile);

        try {
            await updateRequestStatus(selectedRequest.id, formData);
            await fetchRequests();
            closeModal();
        } catch (err) {
            alert('Validation impossible');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !refusalReason) return;
        setLoading(true);
        const admin = JSON.parse(localStorage.getItem('admin'));
        const formData = new FormData();
        formData.append('status', 'Refusé');
        formData.append('refusal_reason', refusalReason);
        formData.append('admin_id', admin?.id || '');
        formData.append('template_overrides', JSON.stringify({}));

        try {
            await updateRequestStatus(selectedRequest.id, formData);
            await fetchRequests();
            closeModal();
        } catch (err) {
            alert('Refus impossible');
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedRequest(null);
        setModalMode('');
        setRefusalReason('');
        setUploadFile(null);
    };

    const parseDetails = (raw) => {
        if (!raw) return {};
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
            return {};
        }
    };

    const renderDetailsView = () => {
        if (!selectedRequest) return null;
        const details = parseDetails(selectedRequest.specific_details);
        const docType = selectedRequest.document_type;

        return (
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Informations de l'étudiant</h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div><span className="font-medium text-gray-700">Nom complet:</span> <span className="text-gray-900">{selectedRequest.first_name} {selectedRequest.last_name}</span></div>
                        <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{selectedRequest.email}</span></div>
                        <div><span className="font-medium text-gray-700">Apogée:</span> <span className="text-gray-900">{selectedRequest.apogee_number}</span></div>
                        <div><span className="font-medium text-gray-700">CIN:</span> <span className="text-gray-900">{selectedRequest.cin || details.cin || 'N/A'}</span></div>
                        {selectedRequest.birth_date && (
                            <div><span className="font-medium text-gray-700">Date de naissance:</span> <span className="text-gray-900">{new Date(selectedRequest.birth_date).toLocaleDateString('fr-FR')}</span></div>
                        )}
                        {selectedRequest.birth_place && (
                            <div><span className="font-medium text-gray-700">Lieu de naissance:</span> <span className="text-gray-900">{selectedRequest.birth_place}</span></div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Détails de la demande</h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                        {/* ... (existing fields) */}
                        {docType === 'school-certificate' && (
                            <>
                                <div><span className="font-medium text-gray-700">Année universitaire:</span> <span className="text-gray-900">{details.academic_year || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Niveau:</span> <span className="text-gray-900">{details.level || selectedRequest.level || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Programme:</span> <span className="text-gray-900">{details.program || selectedRequest.major || 'N/A'}</span></div>
                            </>
                        )}
                        {docType === 'success-certificate' && (
                            <>
                                <div><span className="font-medium text-gray-700">Année universitaire:</span> <span className="text-gray-900">{details.academic_year || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Session:</span> <span className="text-gray-900">{details.session || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Filière:</span> <span className="text-gray-900">{details.filiere || selectedRequest.major || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Mention:</span> <span className="text-gray-900">{details.mention || 'N/A'}</span></div>
                            </>
                        )}
                        {docType === 'transcript' && (
                            <>
                                <div><span className="font-medium text-gray-700">Année universitaire:</span> <span className="text-gray-900">{details.academic_year || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Session:</span> <span className="text-gray-900">{details.session || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Niveau:</span> <span className="text-gray-900">{details.level || selectedRequest.level || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Programme:</span> <span className="text-gray-900">{details.program || selectedRequest.major || 'N/A'}</span></div>
                                {details.modules && details.modules.length > 0 && (
                                    <div className="md:col-span-2">
                                        <span className="font-medium text-gray-700">Modules:</span>
                                        <div className="mt-2 space-y-1">
                                            {details.modules.map((m, idx) => (
                                                <div key={idx} className="text-sm text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">
                                                    {m.name}: <span className="font-semibold">{m.grade}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {docType === 'internship' && (
                            <>
                                <div className="md:col-span-2"><span className="font-medium text-gray-700">Entreprise:</span> <span className="text-gray-900">{details.company_legal_name || details.company_name || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Adresse:</span> <span className="text-gray-900">{details.company_address || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Ville:</span> <span className="text-gray-900">{details.company_city || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Secteur:</span> <span className="text-gray-900">{details.company_sector || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Sujet:</span> <span className="text-gray-900">{details.internship_subject || details.internship_title || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Période:</span> <span className="text-gray-900">{details.start_date && details.end_date ? `${new Date(details.start_date).toLocaleDateString('fr-FR')} - ${new Date(details.end_date).toLocaleDateString('fr-FR')}` : 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Encadrant entreprise:</span> <span className="text-gray-900">{details.supervisor_name || 'N/A'}</span></div>
                                <div><span className="font-medium text-gray-700">Encadrant ENSA:</span> <span className="text-gray-900">{details.ensa_supervisor_name || 'N/A'}</span></div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const tabs = [
        { id: 'all', label: 'Toutes les demandes', icon: DocumentTextIcon },
        { id: 'school-certificate', label: 'Attestations de scolarité', icon: DocumentTextIcon },
        { id: 'success-certificate', label: 'Attestations de réussite', icon: DocumentTextIcon },
        { id: 'transcript', label: 'Relevés de notes', icon: DocumentTextIcon },
        { id: 'internship', label: 'Conventions de stage', icon: DocumentTextIcon },
    ];

    const getTabCount = (tabId) => {
        if (tabId === 'all') return requests.length;
        return requests.filter(req => req.document_type === tabId).length;
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Gestion des demandes</h1>
            </div>

            {/* Global Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-8">
                <div className="relative group">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher par référence, nom, ou numéro apogée..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-lg outline-none transition-all text-sm text-slate-900 placeholder-slate-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <nav className="flex -mb-px">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                                <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {getTabCount(tab.id)}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Table */}
                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Référence</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Étudiant</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Document</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Statut</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        Aucune demande trouvée
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-blue-600">{req.reference}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-slate-900">{req.first_name} {req.last_name}</div>
                                            <div className="text-[11px] font-medium text-slate-400">Apogée: {req.apogee_number}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDocType(req.document_type)}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                            {new Date(req.submission_date).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${getStatusColor(req.status)}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-60"></span>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewDocument(req)}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                                    title="Voir détails"
                                                >
                                                    <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                                                    Détails
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedRequest(req); setModalMode('accept'); }}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                                    title="Accepter"
                                                >
                                                    <CheckIcon className="h-4 w-4" />
                                                    Accepter
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedRequest(req); setModalMode('reject'); }}
                                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                                    title="Refuser"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                    Refuser
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
                            {modalMode === 'view' && renderDetailsView()}

                            {modalMode === 'accept' && (
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-green-900 mb-2">Accepter la demande</h4>
                                        <p className="text-sm text-green-800">Le document généré sera envoyé automatiquement à l'étudiant par email.</p>
                                    </div>

                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 bg-gray-50">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Remplacer le PDF (optionnel)</label>
                                        <div className="flex flex-col md:flex-row gap-4 items-start">
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={e => setUploadFile(e.target.files[0])}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                                            />
                                        </div>
                                        {uploadFile && (
                                            <p className="mt-2 text-sm text-green-600 font-medium">✓ Fichier sélectionné : {uploadFile.name}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleAccept}
                                            disabled={loading}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 transition-all"
                                        >
                                            {loading ? 'Traitement...' : 'Confirmer l\'acceptation'}
                                        </button>
                                        <button
                                            onClick={closeModal}
                                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modalMode === 'reject' && (
                                <div className="space-y-4">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-red-900 mb-2">Refuser la demande</h4>
                                        <p className="text-sm text-red-800">Veuillez indiquer le motif du refus. L'étudiant recevra un email avec cette information.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Motif du refus *</label>
                                        <textarea
                                            rows="4"
                                            placeholder="Expliquez la raison du refus..."
                                            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                                            value={refusalReason}
                                            onChange={e => setRefusalReason(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleReject}
                                            disabled={!refusalReason || loading}
                                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 transition-all"
                                        >
                                            {loading ? 'Traitement...' : 'Confirmer le refus'}
                                        </button>
                                        <button
                                            onClick={closeModal}
                                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                        >
                                            Annuler
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
