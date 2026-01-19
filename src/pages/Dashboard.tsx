import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Plus, Clock, CheckCircle2, AlertTriangle, ArrowUpRight,
    TrendingUp, Wallet, Users, Target, Zap, ShieldCheck, BarChart2,
    Calendar, ArrowDownRight, CreditCard
} from 'lucide-react';
import { AuditRequest, Profile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
    const [allRequests, setAllRequests] = useState<AuditRequest[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('daily');
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfileAndInitialRequests();

        const channel = supabase
            .channel('dashboard-wide-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'requests' },
                () => { refreshRequests(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchProfileAndInitialRequests = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);
            if (profileData) await fetchRequests(profileData);
        }
        setLoading(false);
    };

    const refreshRequests = async () => {
        if (profile) await fetchRequests(profile);
    };

    const fetchRequests = async (profileData: Profile) => {
        try {
            let query = supabase.from('requests').select('*');
            if (profileData.role === 'manager') {
                query = query.eq('department', profileData.department);
            } else if (profileData.role === 'employee') {
                query = query.eq('employee_id', profileData.id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            setAllRequests(data || []);
        } catch (err) {
            console.error('Error fetching requests:', err);
        }
    };

    // --- DATA CALCULATIONS ---
    const statsData = useMemo(() => {
        const totalValue = allRequests.reduce((sum, r) => sum + r.total_amount, 0);
        const pendingCount = allRequests.filter(r => r.status === 'pending').length;
        const actionCount = allRequests.filter(r => r.status === 'changes_requested').length;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const mtdRequests = allRequests.filter(r => new Date(r.created_at) >= startOfMonth);
        const mtdCompleted = mtdRequests.filter(r => ['approved', 'rejected'].includes(r.status)).length;
        const mtdValue = mtdRequests.reduce((sum, r) => sum + r.total_amount, 0);

        const deptMap: Record<string, number> = {};
        allRequests.forEach(r => {
            deptMap[r.department] = (deptMap[r.department] || 0) + r.total_amount;
        });
        const topDepts = Object.entries(deptMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4);

        const catMap: Record<string, number> = {};
        allRequests.forEach(r => {
            catMap[r.category] = (catMap[r.category] || 0) + 1;
        });

        const scoredRequests = allRequests.filter(r => r.ai_completeness_score !== undefined);
        const avgAiScore = scoredRequests.length > 0
            ? Math.round(scoredRequests.reduce((sum, r) => sum + (r.ai_completeness_score || 0), 0) / scoredRequests.length)
            : 0;

        return {
            totalValue, mtdValue, pendingCount, actionCount, mtdCompleted, topDepts, catMap, avgAiScore
        };
    }, [allRequests]);

    const trendStats = useMemo(() => {
        const daily = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const val = allRequests.filter(r => new Date(r.created_at).toDateString() === d.toDateString()).length;
            return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), val };
        });

        const monthly = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            const val = allRequests.filter(r => {
                const rd = new Date(r.created_at);
                return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
            }).length;
            return { label: d.toLocaleDateString('en-US', { month: 'short' }), val };
        });

        return { daily, monthly };
    }, [allRequests]);

    const currentTrend = trendStats[activeTab as keyof typeof trendStats];
    const maxVal = Math.max(...currentTrend.map(t => t.val)) || 1;

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader-ring"></div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '5rem' }}>
            {/* HERO SECTION */}
            <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '32px',
                padding: '4rem 3rem',
                marginBottom: '3rem',
                overflow: 'hidden',
                color: 'white'
            }} className="mobile-p-md">
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1 }} className="mobile-hide">
                    <ShieldCheck size={400} />
                </div>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="mobile-stack">
                    <div className="mobile-full">
                        <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#60a5fa', marginBottom: '1rem', display: 'block' }}>Analytical Overview</motion.span>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.04em', lineHeight: 1 }} className="mobile-h1">Dashboard</h1>
                        <p style={{ fontSize: '1.25rem', opacity: 0.7, maxWidth: '500px', lineHeight: 1.6 }} className="mobile-hide">Welcome back, {profile?.full_name?.split(' ')[0]}. You have <span style={{ color: '#60a5fa', fontWeight: 800 }}>{statsData.pendingCount}</span> requests awaiting review today.</p>
                    </div>
                    {profile?.role === 'employee' && (
                        <button
                            onClick={() => navigate('/create')}
                            className="btn-primary mobile-full"
                            style={{ padding: '12px 24px', borderRadius: '16px', fontSize: '0.95rem', fontWeight: 700, background: 'white', color: '#0f172a', border: 'none', gap: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', marginTop: '2rem' }}
                        >
                            <Plus size={18} /> New Audit Request
                        </button>
                    )}
                    {profile?.role === 'admin' && (
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="btn-primary mobile-full"
                            style={{ padding: '20px 48px', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 900, background: 'white', color: '#0f172a', border: 'none', gap: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', marginTop: '2rem' }}
                        >
                            <Users size={24} /> Manage Team
                        </button>
                    )}
                </div>
            </div>

            {/* KEY METRICS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Total Audited', value: `RM ${(statsData.totalValue / 1000).toFixed(1)}k`, sub: 'Life-to-date volume', icon: Wallet, color: '#2563eb' },
                    { label: 'Month-to-Date', value: `RM ${(statsData.mtdValue / 1000).toFixed(1)}k`, sub: `${statsData.mtdCompleted} completed audits`, icon: Calendar, color: '#10b981' },
                    { label: 'AI Health Score', value: `${statsData.avgAiScore}%`, sub: 'Compliance average', icon: Zap, color: '#7c3aed' },
                    { label: 'Pending Action', value: statsData.pendingCount + statsData.actionCount, sub: 'Requires attention', icon: AlertTriangle, color: '#f59e0b' },
                ].map((stat, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ background: `${stat.color}10`, color: stat.color, width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <stat.icon size={26} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>{stat.value}</h2>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{stat.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* MAIN DATA SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem' }} className="mobile-grid-1">
                {/* Visual Trends Section */}
                <div className="glass-card" style={{ padding: '2.5rem', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }} className="mobile-stack mobile-gap-4">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '12px', color: '#0369a1' }}>
                                <BarChart2 size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Audit Volume Trends</h3>
                        </div>
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '5px', borderRadius: '12px', gap: '5px' }} className="mobile-full">
                            {['daily', 'monthly'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    style={{
                                        flex: 1,
                                        background: activeTab === t ? 'white' : 'transparent',
                                        border: 'none', padding: '8px 24px', borderRadius: '10px',
                                        fontSize: '0.85rem', fontWeight: 800, color: activeTab === t ? '#0f172a' : '#64748b',
                                        cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '300px', padding: '0 10px', overflowX: 'auto' }}>
                        {currentTrend.map((t, i) => (
                            <div key={i} style={{ flex: 1, minWidth: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(t.val / maxVal) * 200}px` }}
                                        style={{
                                            width: '100%', maxWidth: '40px',
                                            background: 'linear-gradient(to top, #2563eb 0%, #60a5fa 100%)',
                                            borderRadius: '12px 12px 4px 4px',
                                            position: 'relative',
                                            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)'
                                        }}
                                    >
                                        <div className="bar-tooltip-v2">{t.val} Audits</div>
                                    </motion.div>
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{t.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', gap: '10px' }}>
                            <Users size={20} color="#2563eb" /> Top Departments
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {statsData.topDepts.map(([name, price], i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 800 }}>
                                        <span style={{ color: '#475569' }}>{name}</span>
                                        <span style={{ color: '#0f172a' }}>RM {(price / 1000).toFixed(1)}k</span>
                                    </div>
                                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(price / (statsData.topDepts[0][1] as number)) * 100}%` }} style={{ height: '100%', background: '#2563eb', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', gap: '10px' }}>
                            <Target size={20} color="#7c3aed" /> Split by Category
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {Object.entries(statsData.catMap).map(([cat, count], i) => (
                                <div key={i} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>{cat}</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{count}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/requests')}
                        className="btn-primary mobile-full"
                        style={{ padding: '20px', borderRadius: '20px', background: '#0f172a', color: 'white', fontWeight: 900, fontSize: '1rem', gap: '12px' }}
                    >
                        View Full Audit Queue <ArrowUpRight size={22} />
                    </button>
                </div>
            </div>

            <style>{`
                .bar-tooltip-v2 {
                    position: absolute; top: -45px; left: 50%; transform: translateX(-50%);
                    background: #0f172a; color: white; padding: 6px 12px; border-radius: 8px;
                    font-size: 11px; font-weight: 800; opacity: 0; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    pointer-events: none; white-space: nowrap; z-index: 10;
                }
                .bar-tooltip-v2::after {
                    content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
                    border-left: 6px solid transparent; border-right: 6px solid transparent;
                    border-top: 6px solid #0f172a;
                }
                .glass-card:hover .bar-tooltip-v2 { opacity: 1; transform: translate(-50%, -5px); }
                .loader-ring { width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
