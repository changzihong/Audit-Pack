import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CreateRequest from './pages/CreateRequest';
import RequestDetail from './pages/RequestDetail';
import ProfilePage from './pages/ProfilePage';
import ArchivePage from './pages/ArchivePage';
import ManageUsers from './pages/ManageUsers';
import Shell from './components/Shell';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

function App() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/dashboard" />} />
                <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} />

                <Route element={<Shell session={session} />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/archive" element={<ArchivePage />} />
                    <Route path="/admin/users" element={<ManageUsers />} />
                    <Route path="/create" element={<CreateRequest />} />
                    <Route path="/request/:id" element={<RequestDetail />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/notifications" element={<div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}><h3>Notifications Center</h3><p style={{ color: '#64748b' }}>You are all caught up!</p></div>} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
