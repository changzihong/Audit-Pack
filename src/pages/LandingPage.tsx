import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, BarChart3, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import kadoshLogo from '../components/image/kadosh_ai_logo.jpeg';

export default function LandingPage() {
    return (
        <div className="landing-root" style={{ background: '#f8fafc', minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Navigation */}
            <nav style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '10px' }}>
                        <ShieldCheck size={24} />
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit' }}>Audit Pack</span>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <Link to="/login" className="btn-primary" style={{ border: 'none' }}>Sign In</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{ padding: '4rem 1.5rem', textAlign: 'center', position: 'relative' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#dbeafe',
                        color: '#1e40af',
                        padding: '8px 16px',
                        borderRadius: '999px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginBottom: '2rem'
                    }} className="mobile-hide">
                        <span style={{ display: 'flex', height: '6px', width: '6px', background: '#1e40af', borderRadius: '50%' }}></span>
                        Now supporting Malaysia 2025 E-Invoicing
                    </div>
                    <h1 style={{ fontSize: '4.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.1 }} className="mobile-h1">
                        Smart Audit Compliance <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #2563eb, #6366f1)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>for Malaysian Businesses</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '800px', margin: '0 auto 3rem', lineHeight: 1.6 }} className="mobile-p-sm">
                        The all-in-one internal approval system that uses AI to auto-validate requests, verify documentation, and ensures your team submits perfect audits every time.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }} className="mobile-stack">
                        <Link to="/login" className="btn-primary mobile-full" style={{ padding: '16px 40px', fontSize: '1.125rem' }}>
                            Get Stared <ArrowRight size={20} />
                        </Link>
                    </div>
                </motion.div>

                {/* Dashboard Preview Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    style={{
                        marginTop: '5rem',
                        maxWidth: '1000px',
                        margin: '5rem auto 0',
                        borderRadius: '24px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
                    }}
                    className="mobile-hide"
                >
                    <div style={{ background: '#0f172a', borderRadius: '16px', overflow: 'hidden', height: '600px', position: 'relative' }}>
                        {/* Simple Mockup Overlay */}
                        <div style={{ position: 'absolute', inset: 0, padding: '2rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }}></div>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }}></div>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }}></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ height: '120px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}></div>
                                ))}
                            </div>
                            <div style={{ height: '300px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}></div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section style={{ padding: '4rem 1.5rem', background: 'white' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }} className="mobile-h2">Built for Modern Compliance</h2>
                    <p style={{ color: '#64748b', fontSize: '1.125rem' }}>Digitize your internal workflow with powerful AI automation.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                    {[
                        { icon: Zap, title: 'AI Smart Checker', desc: 'GPT-4o-mini analyzes every request for common errors before it even reaches a manager.' },
                        { icon: ShieldCheck, title: 'Data Validation', desc: 'Native support for corporate standards. Automatic calculation and documentation checks.' },
                        { icon: Clock, title: '24h Approvals', desc: 'Reduce approval cycles from weeks to hours with one-click manager reviews and AI summaries.' },
                        { icon: BarChart3, title: 'Compliance Audit', desc: 'Maintain a perfect trail for tax seasons with integrated documentation and verification storage.' },
                        { icon: CheckCircle2, title: 'Smart Summaries', desc: 'Managers get instant 3-bullet insights, no more reading through pages of travel claims.' },
                        { icon: ArrowRight, title: 'LHDN Ready', desc: 'Stay ahead of the 2025 E-Invoicing mandate with built-in document recognition.' },
                    ].map((feature, i) => (
                        <div key={i} style={{ padding: '2.5rem', borderRadius: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div style={{ background: 'var(--primary)', color: 'white', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <feature.icon size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>{feature.title}</h3>
                            <p style={{ color: '#64748b', lineHeight: 1.6 }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '4rem 1.5rem', background: '#0f172a', color: 'white', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Audit Pack</span>
                </div>
                <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.875rem' }}>© 2025 Audit Pack Malaysia. All rights reserved.</p>
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>Powered By</span>
                    <img src={kadoshLogo} alt="KadoshAI" style={{ height: '24px', borderRadius: '4px' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>KadoshAI</span>
                </div>
            </footer>
        </div>
    );
}
