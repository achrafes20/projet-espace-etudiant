import React, { useEffect, useState } from 'react';
import { getComplaints, respondToComplaint } from '../../services/api';
import { ChatBubbleLeftRightIcon, CheckCircleIcon, ClockIcon, XCircleIcon, MagnifyingGlassIcon, FunnelIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const DOC_TYPE_LABELS = {
    'school-certificate': 'Attestation de scolarité',
    'success-certificate': 'Attestation de réussite',
    'transcript': 'Relevé de notes',
    'internship': 'Convention de stage'
};

const formatDocType = (docType) => DOC_TYPE_LABELS[docType] || docType;

const ComplaintsList = () => {
    const [complaints, setComplaints] = useState([]);
    const [filteredComplaints, setFilteredComplaints] = useState([]);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'resolved'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [loading, setLoading] = useState(false);

    const serverBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchComplaints();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [complaints, activeTab, searchTerm]);

    const fetchComplaints = async () => {
        try {
            const res = await getComplaints({});
            setComplaints(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const applyFilters = () => {
        let filtered = [...complaints];

        // Filter by status (tab)
        if (activeTab === 'pending') {
            filtered = filtered.filter(c => c.status === 'En attente');
        } else if (activeTab === 'resolved') {
            filtered = filtered.filter(c => c.status === 'Traitée');
        }

        // Filter by search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.complaint_number?.toLowerCase().includes(searchLower) ||
                c.request_reference?.toLowerCase().includes(searchLower) ||
                c.first_name?.toLowerCase().includes(searchLower) ||
                c.last_name?.toLowerCase().includes(searchLower) ||
                c.apogee_number?.toLowerCase().includes(searchLower) ||
                c.reason?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredComplaints(filtered);
    };

    const handleRespond = async () => {
        if (!selectedComplaint || !responseText.trim()) return;
        setLoading(true);
        try {
            const admin = JSON.parse(localStorage.getItem('admin'));
            const formData = new FormData();
            formData.append('response', responseText);
            formData.append('admin_id', admin?.id || '');
            formData.append('regenerate_document', 'false');

            await respondToComplaint(selectedComplaint.id, formData);
            await fetchComplaints();
            setSelectedComplaint(null);
            setResponseText('');
        } catch (err) {
            alert('Échec de l\'envoi de la réponse');
        } finally {
            setLoading(false);
        }
    };



    const tabs = [
        { id: 'pending', label: 'En attente', icon: ClockIcon, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'resolved', label: 'Résolues', icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    ];

    const getTabCount = (tabId) => {
        if (tabId === 'pending') return complaints.filter(c => c.status === 'En attente').length;
        if (tabId === 'resolved') return complaints.filter(c => c.status === 'Traitée').length;
        return 0;
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des réclamations</h1>
                <p className="text-gray-600">Consultez et répondez aux réclamations des étudiants</p>
            </div>

            {/* Global Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-8">
                <div className="relative group">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher par # réclamation, référence de demande ou étudiant..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-lg outline-none transition-all text-sm text-slate-900 placeholder-slate-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-8 py-4 text-sm font-semibold border-b-2 transition-all
                                    ${activeTab === tab.id
                                        ? `border-${tab.color.split('-')[1]}-600 ${tab.color} ${tab.bg}`
                                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                                <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${activeTab === tab.id ? `bg-${tab.color.split('-')[1]}-600 text-white` : 'bg-slate-100 text-slate-500'}`}>
                                    {getTabCount(tab.id)}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Réclamation #</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Étudiant</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Ref. Demande</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Type</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Motif</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredComplaints.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        Aucune réclamation trouvée
                                    </td>
                                </tr>
                            ) : (
                                filteredComplaints.map((comp) => (
                                    <tr key={comp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-orange-600">{comp.complaint_number}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-slate-900">{comp.first_name} {comp.last_name}</div>
                                            <div className="text-[11px] font-medium text-slate-400">Apogée: {comp.apogee_number}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-blue-600 font-bold">{comp.request_reference}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDocType(comp.document_type)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{comp.reason}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-400">
                                            {new Date(comp.submission_date).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedComplaint(comp)}
                                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                            >
                                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                                {comp.status === 'En attente' ? 'Répondre' : 'Voir'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedComplaint(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Réclamation {selectedComplaint.complaint_number}</h2>
                                <p className="text-sm text-gray-600">Demande : {selectedComplaint.request_reference}</p>
                            </div>
                            <button
                                onClick={() => setSelectedComplaint(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XCircleIcon className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Complaint Details */}
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <h4 className="font-semibold text-orange-900 mb-3">Détails de la réclamation</h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Étudiant:</span>
                                        <span className="ml-2 text-gray-900">{selectedComplaint.first_name} {selectedComplaint.last_name}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Type de document:</span>
                                        <span className="ml-2 text-gray-900">{formatDocType(selectedComplaint.document_type)}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Motif:</span>
                                        <span className="ml-2 text-gray-900">{selectedComplaint.reason}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Description:</span>
                                        <p className="mt-1 text-gray-900 bg-white p-3 rounded border border-orange-100">{selectedComplaint.description}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Date de soumission:</span>
                                        <span className="ml-2 text-gray-900">{new Date(selectedComplaint.submission_date).toLocaleString('fr-FR')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Document Links */}
                            {(selectedComplaint.generated_document_path || selectedComplaint.document_path) && (
                                <div className="flex justify-center">
                                    <a
                                        href={`${serverBase}${selectedComplaint.document_path || selectedComplaint.generated_document_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <MagnifyingGlassIcon className="h-5 w-5" />
                                        Voir le document
                                    </a>
                                </div>
                            )}

                            {/* Response Section */}
                            {selectedComplaint.status === 'En attente' ? (
                                <div className="border-2 border-gray-200 rounded-xl p-5 bg-white">
                                    <h4 className="font-semibold text-gray-900 mb-3">Répondre à la réclamation</h4>
                                    <textarea
                                        rows="5"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none mb-4"
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        placeholder="Rédigez votre réponse à l'étudiant..."
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleRespond}
                                            disabled={!responseText.trim() || loading}
                                            className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <PaperAirplaneIcon className="h-5 w-5" />
                                            {loading ? 'Envoi en cours...' : 'Envoyer la réponse'}
                                        </button>
                                        <button
                                            onClick={() => setSelectedComplaint(null)}
                                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-green-200 rounded-xl p-5 bg-green-50">
                                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                        <CheckCircleIcon className="h-5 w-5" />
                                        Réclamation résolue
                                    </h4>
                                    <div className="bg-white rounded-lg p-4 border border-green-200">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Réponse envoyée:</p>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedComplaint.response}</p>
                                    </div>
                                    {selectedComplaint.processing_date && (
                                        <p className="text-xs text-green-700 mt-3">
                                            Traitée le {new Date(selectedComplaint.processing_date).toLocaleString('fr-FR')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintsList;
