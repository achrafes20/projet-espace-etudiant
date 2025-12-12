import React, { useEffect, useState } from 'react';
import { getRequests, updateRequestStatus } from '../../services/api';
import { CheckIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
// I didn't install headlessui, so I'll build a custom modal.
// I didn't install headlessui, so I'll build a custom modal.

const RequestsList = () => {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState({ status: 'all', type: 'all', search: '' });
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalType, setModalType] = useState(''); // 'approve', 'reject'
    const [actionData, setActionData] = useState({ reason: '', file: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            const res = await getRequests(filter);
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAction = async () => {
        if (!selectedRequest) return;
        setLoading(true);

        const admin = JSON.parse(localStorage.getItem('admin'));
        const formData = new FormData();
        formData.append('status', modalType === 'approve' ? 'Accepté' : 'Refusé');
        formData.append('admin_id', admin.id);

        if (modalType === 'approve' && actionData.file) {
            formData.append('document', actionData.file);
        }
        if (modalType === 'reject') {
            formData.append('refusal_reason', actionData.reason);
        }

        try {
            await updateRequestStatus(selectedRequest.id, formData);
            setModalType('');
            setSelectedRequest(null);
            fetchRequests();
        } catch (err) {
            alert('Action failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Management</h1>
                <p className="text-gray-600">Review and process student document requests</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
                <div className="flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                        value={filter.search}
                        onChange={e => setFilter({ ...filter, search: e.target.value })}
                    />
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
                        value={filter.status}
                        onChange={e => setFilter({ ...filter, status: e.target.value })}
                    >
                        <option value="all">All Status</option>
                        <option value="En attente">Pending</option>
                        <option value="Accepté">Accepted</option>
                        <option value="Refusé">Rejected</option>
                    </select>
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
                        value={filter.type}
                        onChange={e => setFilter({ ...filter, type: e.target.value })}
                    >
                        <option value="all">All Types</option>
                        <option value="school-certificate">School Certificate</option>
                        <option value="transcript">Transcript</option>
                        <option value="internship">Internship</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Reference</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Student</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Type</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-primary-600">{req.reference}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {req.first_name} {req.last_name}
                                    <div className="text-xs text-gray-500">{req.apogee_number}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{req.document_type.replace('-', ' ')}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${req.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                                        req.status === 'Accepté' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {req.status === 'En attente' && (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => { setSelectedRequest(req); setModalType('approve'); }}
                                                className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200" title="Approve"
                                            >
                                                <CheckIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedRequest(req); setModalType('reject'); }}
                                                className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Reject"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalType && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4 capitalize">{modalType} Request</h3>
                        <p className="mb-4 text-sm text-gray-600">Reference: <span className="font-bold">{selectedRequest.reference}</span></p>

                        {modalType === 'approve' ? (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Upload Document (PDF)</label>
                                <input type="file" accept="application/pdf" onChange={e => setActionData({ ...actionData, file: e.target.files[0] })} className="w-full border p-2 rounded" />
                            </div>
                        ) : (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Reason for Rejection</label>
                                <textarea rows="3" onChange={e => setActionData({ ...actionData, reason: e.target.value })} className="w-full border p-2 rounded"></textarea>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 mt-6">
                            <button onClick={() => setModalType('')} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                            <button
                                onClick={handleAction}
                                className={`px-4 py-2 text-white rounded-lg ${modalType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                disabled={loading}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestsList;
