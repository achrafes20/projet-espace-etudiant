import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    LineElement,
    PointElement
} from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import { DocumentDuplicateIcon, ExclamationCircleIcon, ChartBarIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { getDashboardStats } from '../../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement);

const DashboardHome = () => {
    const [stats, setStats] = useState({
        pending: 0,
        accepted: 0,
        rejected: 0,
        total: 0,
        byType: {},
        byStatusType: [],
        recent: 0,
        pendingComplaints: 0,
        resolvedComplaints: 0,
        totalComplaints: 0,
        processingRate: 0,
        avgProcessingTime: 0,
        byTypeAndStatus: {}
    });

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await getDashboardStats({});
            setStats(res.data);
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

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                cornerRadius: 8,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1, color: '#64748b' },
                grid: { color: '#f1f5f9' }
            },
            x: {
                ticks: { color: '#64748b' },
                grid: { display: false }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 24,
                    font: { size: 14, weight: '500' },
                    color: '#475569'
                }
            }
        },
        cutout: '75%',
    };

    const barData = {
        labels: Object.keys(stats.byType || {}).map(key => documentTypeLabels[key] || key),
        datasets: [{
            label: 'Nombre de demandes',
            data: Object.values(stats.byType || {}),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderRadius: 12,
            hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
        }]
    };

    const complaintsDoughnutData = {
        labels: ['En attente', 'Résolues'],
        datasets: [{
            data: [
                parseInt(stats.pendingComplaints || 0, 10),
                parseInt(stats.resolvedComplaints || 0, 10)
            ],
            backgroundColor: [
                'rgba(245, 158, 11, 0.8)',
                'rgba(16, 185, 129, 0.8)'
            ],
            borderWidth: 0,
            hoverOffset: 15
        }]
    };

    const totalComplaints = (parseInt(stats.pendingComplaints || 0, 10)) + (parseInt(stats.resolvedComplaints || 0, 10));

    return (
        <div className="p-6 lg:p-10 bg-slate-50/50 min-h-screen animate-in fade-in duration-700">
            <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
                    <p className="text-slate-500 mt-1 font-medium">Gestion et suivi des services académiques</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Mise à jour en temps réel
                </div>
            </div>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ChartBarIcon className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Demandes</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-slate-900">{stats.total}</h3>
                            <span className="text-xs font-medium text-slate-400">depuis l'ouverture</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <AcademicCapIcon className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">En Attente</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-amber-600">{stats.pending}</h3>
                            <span className="text-xs font-medium text-slate-400">à traiter</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <DocumentDuplicateIcon className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Dossiers Traités</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-emerald-600">{stats.accepted + stats.rejected}</h3>
                            <span className="text-xs font-medium text-slate-400">clôturés</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <ExclamationCircleIcon className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Efficacité</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-indigo-600">{stats.processingRate}%</h3>
                            <span className="text-xs font-medium text-slate-400">de complétion</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-8 items-stretch">
                {/* Requests by Type */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Volume par catégorie</h3>
                            <p className="text-sm text-slate-500">Demandes réparties par type de document</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <ChartBarIcon className="h-5 w-5 text-slate-400" />
                        </div>
                    </div>
                    <div className="flex-1 min-h-[350px]">
                        {Object.keys(stats.byType || {}).length > 0 ? (
                            <Bar data={barData} options={barOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-300 text-sm font-medium italic">Données indisponibles</div>
                        )}
                    </div>
                </div>

                {/* Complaints by Status */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">État des réclamations</h3>
                            <p className="text-sm text-slate-500">Suivi du traitement des plaintes</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <ExclamationCircleIcon className="h-5 w-5 text-slate-400" />
                        </div>
                    </div>
                    <div className="flex-1 min-h-[350px] flex items-center justify-center">
                        {totalComplaints > 0 ? (
                            <div className="w-full h-full relative flex items-center justify-center">
                                <Doughnut data={complaintsDoughnutData} options={doughnutOptions} />
                                <div className="absolute flex flex-col items-center justify-center pointer-events-none mb-10">
                                    <span className="text-3xl font-bold text-slate-800">{totalComplaints}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="bg-slate-50 p-6 rounded-2xl mb-4 inline-block">
                                    <ExclamationCircleIcon className="h-10 w-10 text-slate-200" />
                                </div>
                                <p className="text-slate-400 text-sm font-medium italic">Aucune réclamation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
