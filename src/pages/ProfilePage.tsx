import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Lock, Save, Loader2, CheckCircle2, Building2, Mail, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '../types';

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        full_name: '',
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
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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

            // 2. Update Password if provided
            if (formData.new_password) {
                if (formData.new_password !== formData.confirm_password) {
                    throw new Error('Passwords do not match');
                }
                const { error: pwdError } = await supabase.auth.updateUser({
                    password: formData.new_password
                });
                if (pwdError) throw pwdError;
            }

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            setFormData(prev => ({ ...prev, new_password: '', confirm_password: '' }));
            fetchProfile();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setUpdating(false);
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
                            {profile?.role} • {profile?.department}
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#475569' }}>
                            <Building2 size={16} /> {profile?.department}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#475569' }}>
                            <Shield size={16} /> {profile?.role?.toUpperCase()} Access
                        </div>
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

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Lock size={16} /> Security Update
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            </div>

            <style>{`
                .loader-ring { width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
