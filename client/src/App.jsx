import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StudentPortal from './pages/StudentPortal';
import RequestForm from './pages/RequestForm';
import ComplaintForm from './pages/ComplaintForm';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import RequestsList from './pages/admin/RequestsList';
import ComplaintsList from './pages/admin/ComplaintsList';
import HistoryList from './pages/admin/HistoryList';

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                {/* Student Routes */}
                <Route path="/" element={<StudentPortal />} />
                <Route path="/request" element={<RequestForm />} />
                <Route path="/complaint" element={<ComplaintForm />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<DashboardHome />} />
                    <Route path="requests" element={<RequestsList />} />
                    <Route path="complaints" element={<ComplaintsList />} />
                    <Route path="history" element={<HistoryList />} />
                    {/* Default redirect to dashboard */}
                    <Route index element={<DashboardHome />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
