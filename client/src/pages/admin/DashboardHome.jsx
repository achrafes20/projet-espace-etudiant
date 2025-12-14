import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { ClockIcon, CheckCircleIcon, XCircleIcon, DocumentDuplicateIcon, ExclamationCircleIcon, ChartBarIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { getDashboardStats } from '../../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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
        processingRate: 0
    });

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await getDashboardStats();
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const pieData = {
        labels: ['Acceptées', 'Refusées', 'En attente'],
        datasets: [
            {
                data: [stats.accepted, stats.rejected, stats.pending],
                backgroundColor: ['#22c55e', '#ef4444', '#eab308'],
                borderWidth: 2,
                borderColor: '#ffffff',
            },
        ],
    };

    const documentTypeLabels = {
        'school-certificate': 'Attestation de scolarité',
        'success-certificate': 'Attestation de réussite',
        'transcript': 'Relevé de notes',
        'internship': 'Convention de stage'
    };

    const barData = {
        labels: Object.keys(stats.byType || {}).map(key => documentTypeLabels[key] || key),
        datasets: [
            {
                label: 'Nombre de demandes',
                data: Object.values(stats.byType || {}),
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1,
            },
        ],
    };

    const cards = [
        { title: 'En attente', value: stats.pending, icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' },
        { title: 'Acceptées', value: stats.accepted, icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
        { title: 'Refusées', value: stats.rejected, icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
        { title: 'Total demandes', value: stats.total, icon: DocumentDuplicateIcon, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
        { title: 'Réclamations en attente', value: stats.pendingComplaints || 0, icon: ExclamationCircleIcon, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' },
        { title: 'Demandes (7 derniers jours)', value: stats.recent || 0, icon: CalendarIcon, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
                <p className="text-gray-600">Vue d'ensemble et statistiques des services étudiants</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-6 transition-all hover:shadow-lg hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-14 h-14 ${card.bg} rounded-xl flex items-center justify-center border-2 ${card.border}`}>
                                <card.icon className={`h-7 w-7 ${card.color}`} />
                            </div>
                            {idx === 5 && (
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">{stats.processingRate}%</div>
                                    <div className="text-xs text-gray-500">Taux de traitement</div>
                                </div>
                            )}
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{card.value}</h3>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Répartition par statut</h3>
                        <ChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="h-64 flex justify-center items-center">
                        <Pie 
                            data={pieData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Demandes par type de document</h3>
                        <DocumentDuplicateIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="h-64 flex justify-center items-center">
                        {Object.keys(stats.byType || {}).length > 0 ? (
                            <Bar 
                                data={barData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                stepSize: 1,
                                            },
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <p className="text-gray-400">Aucune donnée disponible</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Résumé des statistiques</h3>
                <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-700">{stats.accepted}</div>
                        <div className="text-sm text-green-600 font-medium">Demandes acceptées</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
                        <div className="text-sm text-red-600 font-medium">Demandes refusées</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                        <div className="text-sm text-yellow-600 font-medium">En attente de traitement</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-700">{stats.processingRate}%</div>
                        <div className="text-sm text-blue-600 font-medium">Taux de traitement</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
