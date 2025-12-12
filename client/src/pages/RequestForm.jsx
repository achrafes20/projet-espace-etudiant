import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { validateStudent, createRequest } from '../services/api';
import Header from '../components/Header';

const RequestForm = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [student, setStudent] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        apogee_number: '',
        cin: '',
        document_type: '',
        specific_details: {}
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);

    const handleValidation = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await validateStudent({
                email: formData.email,
                apogee_number: formData.apogee_number,
                cin: formData.cin
            });
            if (res.data.valid) {
                setStudent(res.data.student);
                setStep(2);
            } else {
                setError('Invalid credentials. Please checking your information.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Validation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await createRequest({
                student_id: student.id,
                document_type: formData.document_type,
                specific_details: formData.specific_details
            });
            setSuccessData(res.data);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    const updateDetails = (key, value) => {
        setFormData(prev => ({
            ...prev,
            specific_details: { ...prev.specific_details, [key]: value }
        }));
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
                <button onClick={() => navigate('/')} className="text-primary-600 hover:text-primary-700 font-medium mb-8 flex items-center transition-colors">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Portal
                </button>

                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -z-10" />
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex flex-col items-center bg-gray-50 px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-300 ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {s}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${step >= s ? 'text-primary-600' : 'text-gray-500'}`}>
                                    {s === 1 ? 'Identity' : s === 2 ? 'Document' : 'Done'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Verify Identity</h2>
                            <form onSubmit={handleValidation} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="student@university.edu"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Apogee Number</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        value={formData.apogee_number}
                                        onChange={e => setFormData({ ...formData, apogee_number: e.target.value })}
                                        placeholder="12345678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">CIN</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        value={formData.cin}
                                        onChange={e => setFormData({ ...formData, cin: e.target.value })}
                                        placeholder="AB123456"
                                    />
                                </div>

                                {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

                                <div className="flex justify-end pt-4">
                                    <button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50">
                                        {loading ? 'Verifying...' : 'Next Step'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Document</h2>

                            <div className="grid sm:grid-cols-2 gap-4 mb-8">
                                {[
                                    { id: 'school-certificate', label: 'School Certificate', desc: 'Certificate of enrollment' },
                                    { id: 'success-certificate', label: 'Success Certificate', desc: 'Proof of completion' },
                                    { id: 'transcript', label: 'Transcript', desc: 'Academic records' },
                                    { id: 'internship', label: 'Internship Agreement', desc: 'Internship documentation' }
                                ].map((doc) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => setFormData({ ...formData, document_type: doc.id })}
                                        className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${formData.document_type === doc.id ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
                                    >
                                        <DocumentCheckIcon className={`h-8 w-8 mb-3 ${formData.document_type === doc.id ? 'text-primary-600' : 'text-gray-400'}`} />
                                        <h3 className="font-bold text-gray-900">{doc.label}</h3>
                                        <p className="text-sm text-gray-500">{doc.desc}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Dynamic Fields */}
                            <div className="space-y-6 mb-8 border-t border-gray-100 pt-6">
                                {formData.document_type === 'internship' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                                            <input type="text" onChange={e => updateDetails('company_name', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                                <input type="date" onChange={e => updateDetails('start_date', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                                <input type="date" onChange={e => updateDetails('end_date', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                                            </div>
                                        </div>
                                    </>
                                )}
                                {formData.document_type === 'transcript' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                                        <select onChange={e => updateDetails('academic_year', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                                            <option value="">Select Year</option>
                                            <option value="2023-2024">2023-2024</option>
                                            <option value="2022-2023">2022-2023</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(1)} className="text-gray-600 hover:text-gray-800 font-medium px-6 py-3">Back</button>
                                <button onClick={handleSubmit} disabled={!formData.document_type || loading} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:shadow-none">
                                    {loading ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && successData && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center"
                        >
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircleIcon className="h-12 w-12 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
                            <p className="text-gray-600 mb-8">Your request has been received and is being processed.</p>

                            <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 mb-8 max-w-md mx-auto">
                                <p className="text-sm text-primary-800 uppercase tracking-wide font-semibold mb-1">Reference Number</p>
                                <p className="text-3xl font-bold text-primary-600">{successData.reference}</p>
                            </div>

                            <button onClick={() => navigate('/')} className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-8 rounded-lg transition-colors">
                                Return to Portal
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default RequestForm;
