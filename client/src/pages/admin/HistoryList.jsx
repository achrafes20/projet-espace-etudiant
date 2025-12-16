import React, { useEffect, useMemo, useState } from 'react';
import api, { exportHistory, getHistory } from '../../services/api';
import { MagnifyingGlassIcon, FunnelIcon, DocumentMagnifyingGlassIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const parseDetails = (raw) => {
    if (!raw) return {};
    try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
        return {};
    }
};

const documentTypeLabels = {
    'school-certificate': 'Attestation de scolarité',
    'success-certificate': 'Attestation de réussite',
    'transcript': 'Relevé de notes',
    'internship': 'Convention de stage'
};

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const formatDetailValue = (value) => {
    if (Array.isArray(value)) {
        return value.map(item => {
            if (item && typeof item === 'object') {
                return Object.values(item).filter(Boolean).join(' - ') || JSON.stringify(item);
            }
            return String(item);
        }).join(', ');
    }
    if (value && typeof value === 'object') {
        return Object.entries(value)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
    }
    return value ?? '';
};

const HistoryList = () => {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState({
        status: 'all',
        type: 'all',
        search: '',
        dateFrom: '',
        dateTo: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const fileBaseUrl = useMemo(() => {
        const base = api.defaults?.baseURL || '';
        return base.replace(/\/api$/, '');
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [filter]);

    const fetchHistory = async () => {
        try {
            const res = await getHistory({
                status: filter.status,
                type: filter.type,
                search: filter.search,
                dateFrom: filter.dateFrom,
                dateTo: filter.dateTo
            });
            setRequests(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const resetFilters = () => {
        setFilter({ status: 'all', type: 'all', search: '', dateFrom: '', dateTo: '' });
    };

    const handleExport = async (format) => {
        setIsExporting(true);
        try {
            const res = await exportHistory({
                status: filter.status,
                type: filter.type,
                search: filter.search,
                dateFrom: filter.dateFrom,
                dateTo: filter.dateTo,
                format
            });

            const blob = new Blob([res.data], { type: res.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const extension = format === 'excel' ? 'xlsx' : 'pdf';
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `historique-${new Date().toISOString().split('T')[0]}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    };

    const detailEntries = selectedRequest ? Object.entries(parseDetails(selectedRequest.specific_details || {})) : [];

    const documentLinks = selectedRequest ? [
        { label: 'Document final', path: selectedRequest.document_path },
        { label: 'Document généré', path: selectedRequest.generated_document_path }
    ].filter(doc => !!doc.path) : [];

    const statusBadge = (status) => {
        const accepted = status === 'Accepté' || status === 'AcceptÇ¸' || status === 'AcceptǸ';
        const classes = accepted
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200';
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${classes}`}>
                {status}
            </span>
        );
    };

    const buildFileUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${fileBaseUrl}${path}`;
    };

    return (
        <div>
            <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Historique des demandes</h1>
                    <p className="text-gray-600">Téléchargez les historiques filtrés et consultez les détails complets.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleExport('excel')}
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5 text-emerald-600" />
                        Export Excel
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5 text-rose-600" />
                        Export PDF
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="h-5 w-5 text-gray-500" />
                        <p className="text-sm text-gray-700">Filtres de l'historique</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            Reinitialiser
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="space-y-4 mt-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            <div className="lg:col-span-2 xl:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Reference, nom, apogee..."
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={filter.search}
                                        onChange={e => setFilter({ ...filter, search: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de document</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={filter.type}
                                    onChange={e => setFilter({ ...filter, type: e.target.value })}
                                >
                                    <option value="all">Tous les types</option>
                                    <option value="school-certificate">Attestation de scolarite</option>
                                    <option value="success-certificate">Attestation de reussite</option>
                                    <option value="transcript">Releve de notes</option>
                                    <option value="internship">Convention de stage</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={filter.status}
                                    onChange={e => setFilter({ ...filter, status: e.target.value })}
                                >
                                    <option value="all">Tous les statuts</option>
                                    <option value="Accepté">Accepté</option>
                                    <option value="Refusé">Refusé</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de debut</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={filter.dateFrom}
                                    onChange={e => setFilter({ ...filter, dateFrom: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={filter.dateTo}
                                    onChange={e => setFilter({ ...filter, dateTo: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                            {requests.length} demande{requests.length > 1 ? 's' : ''} trouvée{requests.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Référence</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Soumission</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Traitement</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Étudiant</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Type</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Statut</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Remarques</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        <p className="text-lg font-medium">Aucune demande trouvée</p>
                                        <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-primary-600">{req.reference}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(req.submission_date)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(req.processing_date)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {req.first_name} {req.last_name}
                                            <div className="text-xs text-gray-500">Apogée: {req.apogee_number}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {documentTypeLabels[req.document_type] || req.document_type}
                                        </td>
                                        <td className="px-6 py-4">{statusBadge(req.status)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                            {req.refusal_reason || (req.status === 'AcceptÇ¸' || req.status === 'Accepté' ? 'Document envoyé' : '-')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 border border-primary-100 rounded-lg hover:bg-primary-50 transition"
                                            >
                                                <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                                                Détails
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedRequest && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center py-10 px-4 z-20">
                    <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm text-gray-500">Référence</p>
                                <h2 className="text-2xl font-semibold text-gray-900">{selectedRequest.reference}</h2>
                                <div className="mt-2">{statusBadge(selectedRequest.status)}</div>
                            </div>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Fermer
                            </button>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-xs text-gray-500">Soumission</p>
                                <p className="text-sm font-semibold text-gray-900">{formatDate(selectedRequest.submission_date)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-xs text-gray-500">Traitement</p>
                                <p className="text-sm font-semibold text-gray-900">{formatDate(selectedRequest.processing_date)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-xs text-gray-500">Type</p>
                                <p className="text-sm font-semibold text-gray-900">{documentTypeLabels[selectedRequest.document_type] || selectedRequest.document_type}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Étudiant</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                                    <p className="text-sm text-gray-600">Apogée: {selectedRequest.apogee_number}</p>
                                    <p className="text-sm text-gray-600">Email: {selectedRequest.email}</p>
                                    <p className="text-sm text-gray-600">CIN/CNE: {selectedRequest.cin || '-'} / {selectedRequest.cne || '-'}</p>
                                </div>
                                <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                                    <p className="text-sm text-gray-600">Niveau: {selectedRequest.level || '-'}</p>
                                    <p className="text-sm text-gray-600">Filière: {selectedRequest.major || '-'}</p>
                                    <p className="text-sm text-gray-600">Lieu de naissance: {selectedRequest.birth_place || '-'}</p>
                                    <p className="text-sm text-gray-600">Date de naissance: {selectedRequest.birth_date ? selectedRequest.birth_date.split('T')[0] : '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Détails fournis</h3>
                            {detailEntries.length === 0 ? (
                                <p className="text-sm text-gray-600">Aucun détail supplémentaire</p>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-3">
                                    {detailEntries.map(([key, value]) => (
                                        <div key={key} className="p-3 border border-gray-100 rounded-lg bg-gray-50">
                                            <p className="text-xs uppercase text-gray-500 mb-1">{key}</p>
                                            <p className="text-sm text-gray-800 break-words">{formatDetailValue(value) || '-'}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Fichiers envoyés</h3>
                            {documentLinks.length === 0 ? (
                                <p className="text-sm text-gray-600">Aucun fichier associé</p>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {documentLinks.map(link => {
                                        const href = buildFileUrl(link.path);
                                        return (
                                            <a
                                                key={link.label}
                                                href={href || '#'}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-100 rounded-lg hover:bg-primary-100 transition"
                                            >
                                                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                                                {link.label}
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {selectedRequest.refusal_reason && (
                            <div className="p-4 border border-red-100 rounded-xl bg-red-50">
                                <p className="text-sm font-semibold text-red-800">Motif de refus</p>
                                <p className="text-sm text-red-700 mt-1">{selectedRequest.refusal_reason}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryList;
