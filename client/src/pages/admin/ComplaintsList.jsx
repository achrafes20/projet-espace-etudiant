import React, { useEffect, useState } from 'react';
import { getComplaints } from '../../services/api';

const ComplaintsList = () => {
    const [complaints, setComplaints] = useState([]);

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

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Complaints Management</h1>
                <p className="text-gray-600">Review and respond to student complaints</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Complaint #</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Student</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Request Ref</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Reason</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
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
                                    <button className="text-primary-600 hover:text-primary-800 font-medium text-xs">View/Respond</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComplaintsList;
