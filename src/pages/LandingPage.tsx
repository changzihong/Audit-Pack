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
                        Now supporting Coperate Audit
                    </div>
                    <h1 style={{ fontSize: '4.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.1 }} className="mobile-h1">
                        Smart Audit Compliance <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #2563eb, #6366f1)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>for Coperate Businesses</span>
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
            </section>

            {/* Features Grid */}
            <section style={{ padding: '4rem 1.5rem', background: 'white' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }} className="mobile-h2">Built for Modern Compliance</h2>
                    <p style={{ color: '#64748b', fontSize: '1.125rem' }}>Digitize your internal workflow with powerful AI automation.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                    {[
                        { icon: Zap, title: 'AI Smart Checker', desc: 'Automatically reviews documents using AI-powered rules.' },
                        { icon: ShieldCheck, title: 'Data Validation', desc: 'Ensures accuracy and consistency across all submitted data.' },
                        { icon: Clock, title: '24h Approvals', desc: 'Fast approval workflows completed within 24 hours.' },
                        { icon: BarChart3, title: 'Compliance Audit', desc: 'Detailed audit trails for regulatory and internal compliance.' },
                        { icon: CheckCircle2, title: 'Smart Summaries', desc: 'Instant AI-generated summaries for quick decision making.' },
                        { icon: ArrowRight, title: 'LHDN Ready', desc: 'Fully compliant and ready for LHDN submission.' },
                    ].map((feature, i) => (
                        <div key={i} style={{ padding: '2.5rem', borderRadius: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ background: 'var(--primary)', color: 'white', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
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
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.875rem' }}>
                    <span>Copyright © 2026</span>
                    <img src={kadoshLogo} alt="KadoshAI" style={{ height: '20px', borderRadius: '4px', opacity: 0.9 }} />
                    <span>KadoshAI. All rights reserved.</span>
                </div>
            </footer>
        </div>
    );
}
