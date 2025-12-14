
import React, { useEffect, useState } from 'react';
import { getRequests } from '../../services/api';

const HistoryList = () => {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState({ status: 'processed', type: 'all', search: '' });

    useEffect(() => {
        fetchHistory();
    }, [filter]);

    const fetchHistory = async () => {
        try {
            const params = filter.status === 'processed' ? { status: 'all' } : { status: filter.status };
            const res = await getRequests(params);
            const history = res.data.filter(r => r.status !== 'En attente');
            setRequests(history.filter(r => (filter.type === 'all' || r.document_type === filter.type) && (
                r.reference.includes(filter.search) || r.last_name?.toLowerCase().includes(filter.search.toLowerCase())
            )));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Historique des demandes</h1>
                <p className="text-gray-600">Consultation des demandes acceptées ou refusées.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 p-4 flex flex-wrap gap-4">
                <input
                    type="text"
                    placeholder="Référence ou nom..."
                    className="px-4 py-2 border rounded-lg flex-1 min-w-[180px]"
                    value={filter.search}
                    onChange={e => setFilter({ ...filter, search: e.target.value })}
                />
                <select
                    className="px-4 py-2 border rounded-lg"
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Référence</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Étudiant</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Type</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Statut</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Remarques</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-primary-600">{req.reference}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{new Date(req.submission_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{req.first_name} {req.last_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{req.document_type}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${req.status === 'Accepté' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{req.refusal_reason || 'Document envoyé'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistoryList;
