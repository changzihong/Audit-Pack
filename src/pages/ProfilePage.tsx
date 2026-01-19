import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Lock, Save, Loader2, CheckCircle2, Building2, Mail, Shield, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '../types';

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newDeptName, setNewDeptName] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [orgName, setOrgName] = useState('');

    const [formData, setFormData] = useState({
        full_name: '',
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(data);
            if (data) {
                setFormData(prev => ({ ...prev, full_name: data.full_name || '' }));
                if (data.organization_id) {
                    fetchDepartments(data.organization_id);
                    fetchOrgName(data.organization_id);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrgName = async (orgId: string) => {
        const { data } = await supabase.from('organizations').select('name').eq('id', orgId).single();
        if (data) setOrgName(data.name);
    };

    const fetchDepartments = async (orgId: string) => {
        const { data } = await supabase.from('departments').select('*').eq('organization_id', orgId).order('name');
        setDepartments(data || []);
    };

    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const handleForgotPassword = () => {
        setShowForgotModal(true);
    };

    const confirmPasswordReset = async () => {
        setResetLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) return;

            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: window.location.origin + '/profile'
            });
            if (error) throw error;

            setShowForgotModal(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
        } catch (err: any) {
            setError('Error sending reset email: ' + err.message);
            setShowForgotModal(false);
        } finally {
            setResetLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Update Name in Profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: formData.full_name })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Update Company Name (Admin only)
            if (profile?.role === 'admin' && orgName && profile.organization_id) {
                const { error: orgError } = await supabase
                    .from('organizations')
                    .update({ name: orgName })
                    .eq('id', profile.organization_id);
                if (orgError) throw orgError;
            }

            // 3. Update Password if provided
            if (formData.new_password) {
                if (!formData.old_password) {
                    throw new Error('Please enter your current password to set a new one.');
                }
                if (formData.new_password !== formData.confirm_password) {
                    throw new Error('New passwords do not match');
                }

                // Verify Validation: Try signing in with old password
                if (user.email) {
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email: user.email,
                        password: formData.old_password
                    });
                    if (signInError) throw new Error('Incorrect current password.');
                }

                const { error: pwdError } = await supabase.auth.updateUser({
                    password: formData.new_password
                });
                if (pwdError) throw pwdError;
            }

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            setFormData(prev => ({ ...prev, old_password: '', new_password: '', confirm_password: '' }));
            fetchProfile(); // Refresh details

        } catch (err: any) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleSelectDepartment = async () => {
        if (!selectedDept || !profile) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ department: selectedDept })
                .eq('id', profile.id);

            if (error) throw error;
            // Force reload to update Shell state and access the app
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleAddDepartment = async () => {
        if (!newDeptName || !profile?.organization_id) return;
        try {
            const { error } = await supabase.from('departments').insert({
                organization_id: profile.organization_id,
                name: newDeptName
            });
            if (error) throw error;
            setNewDeptName('');
            fetchDepartments(profile.organization_id);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader-ring"></div>
        </div>
    );

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.02em' }} className="mobile-h1">Profile Settings</h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }} className="mobile-hide">Manage your personal details and account security.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1.5fr', gap: '2rem' }} className="mobile-grid-1">
                {/* Visual Identity Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(to bottom, #ffffff, #f8fafc)' }}>
                        <div style={{
                            width: '100px', height: '100px', background: 'linear-gradient(135deg, #1e40af, #2563eb)',
                            borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem', color: 'white', boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)'
                        }}>
                            <User size={48} />
                        </div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 800 }}>{profile?.full_name}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            {profile?.role} • {profile?.department || 'Unassigned'}
                        </p>
                    </div>

                    {/* Department Section */}
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={16} /> Department
                        </h4>

                        {/* Admin: Add New Department */}
                        {profile?.role === 'admin' && (
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', marginBottom: '8px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Create New Department</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. Finance"
                                        className="input-field"
                                        style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                                        value={newDeptName}
                                        onChange={(e) => setNewDeptName(e.target.value)}
                                    />
                                    <button onClick={handleAddDepartment} className="btn-primary" style={{ padding: '0 12px', borderRadius: '8px' }}><PlusCircle size={16} /></button>
                                </div>
                            </div>
                        )}

                        {/* Department Selection (For Employees/Managers if not set) */}
                        {!profile?.department && profile?.role !== 'admin' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ fontSize: '0.8rem', color: '#ef4444', margin: 0 }}>
                                    Please select your department to continue.
                                </p>
                                <select
                                    className="input-field"
                                    style={{ padding: '8px', fontSize: '0.9rem' }}
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                >
                                    <option value="">Select Department...</option>
                                    {departments
                                        .filter(d => d.name !== 'General')
                                        .map(d => (
                                            <option key={d.id} value={d.name}>{d.name}</option>
                                        ))}
                                </select>
                                <button
                                    onClick={handleSelectDepartment}
                                    className="btn-primary"
                                    disabled={!selectedDept || updating}
                                    style={{ width: '100%', borderRadius: '8px', padding: '8px' }}
                                >
                                    Confirm Assignment
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#475569' }}>
                                    <CheckCircle2 size={16} color="#16a34a" />
                                    <span>Assigned to <strong>{profile?.department || (profile?.role === 'admin' ? 'General' : 'Unassigned')}</strong></span>
                                </div>
                                {profile?.role !== 'admin' && <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>To change departments, please contact support.</p>}
                            </div>
                        )}

                        {/* Admin: List of Existing Departments */}
                        {profile?.role === 'admin' && (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>All Organization Departments</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {departments.length > 0 ? departments.map(d => (
                                        <span key={d.id} style={{ background: '#eff6ff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', color: '#1e40af', fontWeight: 600, border: '1px solid #dbeafe' }}>{d.name}</span>
                                    )) : <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No departments created yet.</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Card */}
                <div className="glass-card mobile-p-md" style={{ padding: '2.5rem', border: '1.5px solid #f1f5f9' }}>
                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '12px 16px', background: '#d1fae5', color: '#065f46', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <CheckCircle2 size={18} /> Profile updated successfully!
                                </motion.div>
                            )}
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="input-group">
                            <label className="input-label" style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ paddingLeft: '44px', borderRadius: '12px' }}
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {profile?.role === 'admin' && (
                            <div className="input-group">
                                <label className="input-label" style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company Name</label>
                                <div style={{ position: 'relative' }}>
                                    <Building2 size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        type="text"
                                        className="input-field"
                                        style={{ paddingLeft: '44px', borderRadius: '12px' }}
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Lock size={16} /> Security Update
                                </h4>
                                <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                                    Forgot Password?
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Required to set new password"
                                        style={{ borderRadius: '12px' }}
                                        value={formData.old_password}
                                        onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Leave blank to keep current"
                                        style={{ borderRadius: '12px' }}
                                        value={formData.new_password}
                                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        style={{ borderRadius: '12px' }}
                                        value={formData.confirm_password}
                                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                            <button type="submit" className="btn-primary mobile-full" style={{ padding: '0 40px', height: '52px', borderRadius: '14px', gap: '10px', fontSize: '1rem', fontWeight: 700 }} disabled={updating}>
                                {updating ? <Loader2 size={24} className="animate-spin" /> : <><Save size={20} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>
                {/* FORGOT PASSWORD CONFIRMATION MODAL */}
                <AnimatePresence>
                    {showForgotModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowForgotModal(false)}
                            style={{
                                position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                                zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    background: 'white', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '400px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '20px', background: '#eff6ff', color: '#2563eb',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
                                }}>
                                    <Mail size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                                    Reset Password?
                                </h3>
                                <p style={{ color: '#64748b', margin: '0 0 2rem 0', lineHeight: 1.5 }}>
                                    We will send a password reset link to your registered email address. Are you sure you want to continue?
                                </p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => setShowForgotModal(false)}
                                        style={{
                                            flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white',
                                            color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '1rem'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmPasswordReset}
                                        disabled={resetLoading}
                                        className="btn-primary"
                                        style={{
                                            flex: 1, padding: '14px', borderRadius: '14px', fontSize: '1rem', fontWeight: 700,
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                                        }}
                                    >
                                        {resetLoading ? <Loader2 size={20} className="animate-spin" /> : 'Yes, Send It'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            <style>{`
                .loader-ring { width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
