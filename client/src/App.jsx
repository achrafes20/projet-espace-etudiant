import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen';

const StudentPortal = lazy(() => import('./pages/StudentPortal'));
const RequestForm = lazy(() => import('./pages/RequestForm'));
const ComplaintForm = lazy(() => import('./pages/ComplaintForm'));
const StatusCheck = lazy(() => import('./pages/StatusCheck'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const DashboardHome = lazy(() => import('./pages/admin/DashboardHome'));
const RequestsList = lazy(() => import('./pages/admin/RequestsList'));
const ComplaintsList = lazy(() => import('./pages/admin/ComplaintsList'));
const HistoryList = lazy(() => import('./pages/admin/HistoryList'));

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<LoadingScreen />}>
                <Routes>
                    {/* Student Routes */}
                    <Route path="/" element={<StudentPortal />} />
                    <Route path="/request" element={<RequestForm />} />
                    <Route path="/complaint" element={<ComplaintForm />} />
                    <Route path="/status" element={<StatusCheck />} />

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
            </Suspense>
        </Router>
    );
}

export default App;
