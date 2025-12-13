import React, { useEffect, useState } from 'react';
import { getComplaints, respondToComplaint } from '../../services/api';

const ComplaintsList = () => {
    const [complaints, setComplaints] = useState([]);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [responseText, setResponseText] = useState('');

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

    const handleRespond = async () => {
        try {
            await respondToComplaint(selectedComplaint.id, {
                response: responseText,
                admin_id: 1 // TODO: Get actual logged in admin ID
            });
            setSelectedComplaint(null);
            setResponseText('');
            // Refresh list
            fetchComplaints();
        } catch (err) {
            alert('Failed to send response');
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
                                    <button
                                        onClick={() => setSelectedComplaint(comp)}
                                        className="text-primary-600 hover:text-primary-800 font-medium text-xs"
                                    >
                                        View/Respond
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Response Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Respond to Complaint</h3>

                        <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-semibold text-gray-700">Complaint Details:</p>
                            <p className="text-sm text-gray-600 mt-1">{selectedComplaint.description}</p>
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
                        <textarea
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none mb-4"
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Write your response to the student..."
                        ></textarea>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setSelectedComplaint(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRespond}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
                            >
                                Send Response
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintsList;
