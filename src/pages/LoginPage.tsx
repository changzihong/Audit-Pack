import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Mail, Lock, ShieldCheck, ArrowRight, User, Building2,
    CheckCircle2, Loader2, Sparkles, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('employee');
    const [department, setDepartment] = useState('Engineering');
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const departments = [
        'Engineering', 'Finance & Accounting', 'Human Resources',
        'Operations', 'Sales & Marketing', 'IT Support', 'General'
    ];

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                if (password !== confirmPassword) throw new Error("Passwords don't match");
                if (!agreed) throw new Error("Please agree to the Terms & Conditions");
                if (!fullName) throw new Error("Please enter your full name");

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: role,
                            department: role === 'admin' ? 'General' : department,
                        }
                    }
                });
                if (error) throw error;
                alert('Sign up successful!');
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    padding: '3.5rem',
                    background: 'rgba(255, 255, 255, 0.98)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    borderRadius: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <motion.div
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        style={{
                            background: 'var(--primary)',
                            color: 'white',
                            padding: '16px',
                            borderRadius: '20px',
                            display: 'inline-flex',
                            marginBottom: '1.5rem',
                            boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)'
                        }}
                    >
                        <ShieldCheck size={40} />
                    </motion.div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 850, color: '#0f172a', margin: '0 0 0.5rem 0', letterSpacing: '-0.03em', fontFamily: 'Outfit' }}>Audit Pack</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>
                        {isSignUp ? 'Create your professional account' : 'Enterprise Portal'}
                    </p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                background: '#fef2f2',
                                color: '#ef4444',
                                padding: '1rem',
                                borderRadius: '14px',
                                marginBottom: '2rem',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                border: '1px solid #fee2e2',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <div style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {isSignUp && (
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    style={{ paddingLeft: '48px' }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label"> Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="email"
                                className="input-field"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '48px' }}
                            />
                        </div>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {isSignUp && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: role === 'admin' ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="input-label">Role</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <select
                                                className="input-field"
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                                style={{ paddingLeft: '48px' }}
                                            >
                                                <option value="employee">Employee</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                    {role !== 'admin' && (
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label className="input-label">Department</label>
                                            <div style={{ position: 'relative' }}>
                                                <Building size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                <select
                                                    className="input-field"
                                                    value={department}
                                                    onChange={(e) => setDepartment(e.target.value)}
                                                    style={{ paddingLeft: '48px' }}
                                                >
                                                    {departments.map((dept) => (
                                                        <option key={dept} value={dept}>{dept}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Security Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: '48px' }}
                            />
                        </div>
                    </div>

                    {isSignUp && (
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    style={{ paddingLeft: '48px' }}
                                />
                            </div>
                        </div>
                    )}

                    {!isSignUp ? (
                        <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', width: 'fit-content', cursor: 'pointer', padding: 0 }}
                        >
                            Forgot password?
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                style={{ marginTop: '4px', cursor: 'pointer', width: '18px', height: '18px' }}
                            />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                                I certify that the information provided is accurate and I agree to the <span style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Corporate Audit Terms & conditions</span>.
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem', height: '56px', borderRadius: '16px', fontSize: '1.05rem', fontWeight: 700, gap: '12px' }}
                    >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : (
                            <>
                                {isSignUp ? 'Initiate Account Creation' : 'Login'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    <p style={{ textAlign: 'center', margin: '1rem 0 0 0', color: '#64748b', fontWeight: 500 }}>
                        {isSignUp ? 'Already authorized?' : "Don't have an account?"}{' '}
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 750, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            {isSignUp ? 'Login secure portal' : 'Sign up '}
                        </button>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
