
import React, { useEffect, useState } from 'react';
import { getRequests } from '../../services/api';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const HistoryList = () => {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState({ 
        status: 'all', 
        type: 'all', 
        search: '',
        dateFrom: '',
        dateTo: ''
    });
    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [filter]);

    const fetchHistory = async () => {
        try {
            const params = { 
                status: filter.status === 'all' ? 'all' : filter.status,
                type: filter.type,
                search: filter.search
            };
            const res = await getRequests(params);
            let history = res.data.filter(r => r.status !== 'En attente');
            
            // Filtrage par date côté client
            if (filter.dateFrom) {
                history = history.filter(r => new Date(r.submission_date) >= new Date(filter.dateFrom));
            }
            if (filter.dateTo) {
                history = history.filter(r => new Date(r.submission_date) <= new Date(filter.dateTo));
            }
            
            setRequests(history);
        } catch (err) {
            console.error(err);
        }
    };

    const documentTypeLabels = {
        'school-certificate': 'Attestation de scolarité',
        'success-certificate': 'Attestation de réussite',
        'transcript': 'Relevé de notes',
        'internship': 'Convention de stage'
    };

    const resetFilters = () => {
        setFilter({ status: 'all', type: 'all', search: '', dateFrom: '', dateTo: '' });
    };

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Historique des demandes</h1>
                    <p className="text-gray-600">Consultation de l'ensemble des demandes traitées (acceptées ou refusées)</p>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <FunnelIcon className="h-5 w-5 mr-2" />
                    {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
                </button>
            </div>

            {showFilters && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Référence, nom, apogée..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={filter.search}
                                    onChange={e => setFilter({ ...filter, search: e.target.value })}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type de document</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
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
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={filter.status}
                                onChange={e => setFilter({ ...filter, status: e.target.value })}
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="Accepté">Accepté</option>
                                <option value="Refusé">Refusé</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
                            <button
                                onClick={resetFilters}
                                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={filter.dateFrom}
                                onChange={e => setFilter({ ...filter, dateFrom: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={filter.dateTo}
                                onChange={e => setFilter({ ...filter, dateTo: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}

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
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Date de soumission</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Date de traitement</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Étudiant</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Type</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Statut</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Remarques</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <p className="text-lg font-medium">Aucune demande trouvée</p>
                                        <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-primary-600">{req.reference}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(req.submission_date).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {req.processing_date ? new Date(req.processing_date).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {req.first_name} {req.last_name}
                                            <div className="text-xs text-gray-500">Apogée: {req.apogee_number}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {documentTypeLabels[req.document_type] || req.document_type}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                req.status === 'Accepté' 
                                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                            {req.refusal_reason || (req.status === 'Accepté' ? 'Document envoyé' : '-')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HistoryList;
