import React, { useEffect, useState } from 'react';
import { getRequests } from '../../services/api';

const HistoryList = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        // Fetch all requests but we might want to filter client-side or server-side for closed ones
        // For now, fetching all and filtering in UI or modifying API to support 'processed'
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await getRequests({ status: 'all' });
            // Filter for accepted or rejected
            const history = res.data.filter(r => r.status !== 'En attente');
            setRequests(history);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Request History</h1>
                <p className="text-gray-600">View all processed requests</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Reference</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Student</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Type</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Processed By</th>
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
                                <td className="px-6 py-4 text-sm text-gray-600">Admin</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistoryList;
