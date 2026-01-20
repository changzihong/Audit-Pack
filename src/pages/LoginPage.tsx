import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Mail, Lock, ShieldCheck, ArrowRight, User, Building2,
    CheckCircle2, Loader2, Sparkles, Building, X, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [role, setRole] = useState('employee');
    const [department, setDepartment] = useState('Engineering');
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showTerms, setShowTerms] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    const departments = [
        'Engineering', 'Finance & Accounting', 'Human Resources',
        'Operations', 'Sales & Marketing', 'IT Support', 'General'
    ];

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (!email) throw new Error("Please enter your email address");

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSuccess('Password reset email sent! Please check your inbox.');
            setTimeout(() => {
                setIsForgotPassword(false);
                setSuccess(null);
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isSignUp) {
                if (password !== confirmPassword) throw new Error("Passwords don't match");
                if (!agreed) throw new Error("Please agree to the Terms & Conditions");
                if (!fullName.trim()) throw new Error("Please enter your full name");
                if (!companyName.trim()) throw new Error("Please enter your company name");

                const { error } = await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: {
                        data: {
                            full_name: fullName.trim(),
                            company_name: companyName.trim(),
                            role: role,
                            // Department will be set to NULL or General by default, user chooses later
                        }
                    }
                });
                if (error) throw error;
                if (error) throw error;
                setShowSuccessModal(true);
            } else {
                const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                // Check role for redirect
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                    if (profile?.role === 'admin') {
                        navigate('/profile');
                    } else {
                        navigate('/dashboard');
                    }
                } else {
                    navigate('/dashboard');
                }
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
            padding: '1.5rem'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card login-card"
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
                        {isForgotPassword ? 'Reset your password' : isSignUp ? 'Create your professional account' : 'Enterprise Compliance Portal'}
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
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                background: '#f0fdf4',
                                color: '#16a34a',
                                padding: '1rem',
                                borderRadius: '14px',
                                marginBottom: '2rem',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                border: '1px solid #bbf7d0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <CheckCircle2 size={18} />
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={isForgotPassword ? handleForgotPassword : handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {isSignUp && !isForgotPassword && (
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
                        <label className="input-label">Corporate Email</label>
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
                        {isForgotPassword && (
                            <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        )}
                    </div>

                    {isSignUp && !isForgotPassword && (
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Company Name</label>
                            <div style={{ position: 'relative' }}>
                                <Building2 size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Acme Corp"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                    style={{ paddingLeft: '48px' }}
                                />
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {isSignUp && !isForgotPassword && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: role === 'admin' ? '1fr' : '1fr', gap: '1rem' }} className="mobile-grid-1">
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
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {
                        !isForgotPassword && (
                            <>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Security Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="input-field"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            style={{ paddingLeft: '48px', paddingRight: '48px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '16px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                color: '#94a3b8',
                                                cursor: 'pointer',
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {isSignUp && (
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="input-label">Confirm Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="input-field"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '16px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#94a3b8',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )
                    }

                    {
                        !isSignUp && !isForgotPassword ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsForgotPassword(true);
                                    setError(null);
                                    setSuccess(null);
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', width: 'fit-content', cursor: 'pointer', padding: 0 }}
                            >
                                Forgot password?
                            </button>
                        ) : isForgotPassword ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setError(null);
                                    setSuccess(null);
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', width: 'fit-content', cursor: 'pointer', padding: 0 }}
                            >
                                Back to login
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
                                    I certify that the information provided is accurate and I agree to the <span
                                        onClick={() => setShowTerms(true)}
                                        style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Corporate Audit Terms & conditions</span>.
                                </p>
                            </div>
                        )
                    }

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem', height: '56px', borderRadius: '16px', fontSize: '1.05rem', fontWeight: 700, gap: '12px' }}
                    >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : (
                            <>
                                {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Initiate Account Creation' : 'Login'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    {
                        !isForgotPassword && (
                            <p style={{ textAlign: 'center', margin: '1rem 0 0 0', color: '#64748b', fontWeight: 500 }}>
                                {isSignUp ? 'Already authorized?' : "Don't have an enterprise account?"}{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSignUp(!isSignUp);
                                        setError(null);
                                        setSuccess(null);
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 750, cursor: 'pointer' }}
                                >
                                    {isSignUp ? 'Login secure portal' : 'Sign up corporate'}
                                </button>
                            </p>
                        )
                    }
                </form >
            </motion.div >
            <AnimatePresence>
                {showTerms && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.8)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1.5rem'
                        }}
                        onClick={() => setShowTerms(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="mobile-p-md"
                            style={{
                                width: '100%',
                                maxWidth: '600px',
                                background: 'white',
                                borderRadius: '24px',
                                padding: '2.5rem',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                position: 'relative',
                                maxHeight: '80vh',
                                overflowY: 'auto'
                            }}
                        >
                            <button
                                onClick={() => setShowTerms(false)}
                                style={{
                                    position: 'absolute',
                                    top: '1.5rem',
                                    right: '1.5rem',
                                    background: '#f1f5f9',
                                    border: 'none',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    color: '#64748b'
                                }}
                            >
                                <X size={20} />
                            </button>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a', fontFamily: 'Outfit' }}>Corporate Audit Terms & Conditions</h2>
                            {/* Terms content same as before */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                <section>
                                    <h4 style={{ color: '#0f172a', marginBottom: '0.5rem', fontWeight: 700 }}>1. Accuracy of Information</h4>
                                    <p>You certify that all information provided during registration and in audit requests is truthful, accurate, and complete. Any intentional misrepresentation may lead to account termination.</p>
                                </section>

                                <section>
                                    <h4 style={{ color: '#0f172a', marginBottom: '0.5rem', fontWeight: 700 }}>2. Authorized Enterprise Use</h4>
                                    <p>Access is restricted to authorized personnel of the registering entity. Account sharing or unauthorized access to sensitive financial data is strictly prohibited and subject to internal disciplinary action.</p>
                                </section>

                                <section>
                                    <h4 style={{ color: '#0f172a', marginBottom: '0.5rem', fontWeight: 700 }}>3. Data Confidentiality</h4>
                                    <p>All audit trails, e-invoices, and internal approval data processed through Audit Pack must be treated as highly confidential in accordance with corporate data protection policies.</p>
                                </section>

                                <section>
                                    <h4 style={{ color: '#0f172a', marginBottom: '0.5rem', fontWeight: 700 }}>4. AI Processing Disclaimer</h4>
                                    <p>You acknowledge that AI-generated summaries and documentation checks (GPT-4o-mini) are for guidance only. Final accountability for compliance rests with the designated Manager or Admin.</p>
                                </section>

                                <section>
                                    <h4 style={{ color: '#0f172a', marginBottom: '0.5rem', fontWeight: 700 }}>5. Regulatory Compliance</h4>
                                    <p>All submissions must adhere to the latest LHDN E-Invoicing standards (2025 mandate) and Malaysia’s Personal Data Protection Act (PDPA).</p>
                                </section>

                                <section>
                                    <h4 style={{ color: '#0f172a', marginBottom: '0.5rem', fontWeight: 700 }}>6. Audit Logs</h4>
                                    <p>Every action taken within the platform is logged with a timestamp and user ID to ensure a tamper-proof audit trail for tax and regulatory purposes.</p>
                                </section>
                            </div>

                            <button
                                onClick={() => setShowTerms(false)}
                                className="btn-primary"
                                style={{ marginTop: '2.5rem', width: '100%', height: '52px', borderRadius: '12px' }}
                            >
                                I Understand
                            </button>
                        </motion.div>
                    </motion.div>
                )}

            </AnimatePresence>

            {/* SUCCESS MODAL */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                            zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'white', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '400px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', textAlign: 'center'
                            }}
                        >
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                                boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.2)'
                            }}>
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0', fontFamily: 'Outfit' }}>
                                Welcome Aboard!
                            </h3>
                            <p style={{ color: '#64748b', margin: '0 0 2rem 0', lineHeight: 1.6, fontSize: '1rem' }}>
                                Your corporate account has been successfully created. You can now access the full Audit Pack suite.
                            </p>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setIsSignUp(false);
                                }}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#0f172a',
                                    color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1.05rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                Proceed to Login <ArrowRight size={20} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @media (max-width: 480px) {
                    .login-card {
                        padding: 2rem !important;
                    }
                }
            `}</style>
        </div >
    );
}
