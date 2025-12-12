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
import { ClockIcon, CheckCircleIcon, XCircleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { getDashboardStats } from '../../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const DashboardHome = () => {
    const [stats, setStats] = useState({ pending: 0, accepted: 0, rejected: 0, total: 0 });

    useEffect(() => {
        fetchStats();
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
        labels: ['Accepted', 'Rejected', 'Pending'],
        datasets: [
            {
                data: [stats.accepted, stats.rejected, stats.pending],
                backgroundColor: ['#22c55e', '#ef4444', '#eab308'],
                borderWidth: 0,
            },
        ],
    };

    const cards = [
        { title: 'Pending Requests', value: stats.pending, icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { title: 'Accepted Requests', value: stats.accepted, icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Rejected Requests', value: stats.rejected, icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-100' },
        { title: 'Total Requests', value: stats.total, icon: DocumentDuplicateIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
                <p className="text-gray-600">Monitor and manage student service requests</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 ${card.bg} rounded-lg flex items-center justify-center`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{card.value}</h3>
                        <p className="text-sm text-gray-600">{card.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Request Status Distribution</h3>
                    <div className="h-64 flex justify-center">
                        <Pie data={pieData} />
                    </div>
                </div>
                {/* Placeholder for another chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center text-gray-400">
                    More analytics coming soon...
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
