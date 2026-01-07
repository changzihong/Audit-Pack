import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Plus, Clock, CheckCircle2, AlertTriangle, ArrowUpRight,
    Search, Filter, MoreVertical, FileText, Info, BarChart3, TrendingUp, Calendar as CalendarIcon, XCircle
} from 'lucide-react';
import { AuditRequest, Profile } from '../types';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const [requests, setRequests] = useState<AuditRequest[]>([]);
    const [allRequests, setAllRequests] = useState<AuditRequest[]>([]);
    const [mtdCount, setMtdCount] = useState(0);
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
                () => {
                    refreshRequests();
                }
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
        if (profile) {
            await fetchRequests(profile);
        }
    };

    const fetchRequests = async (profileData: Profile) => {
        try {
            let query = supabase.from('requests').select('*');

            if (profileData.role === 'admin') {
                // Admins see everything
            } else if (profileData.role === 'manager') {
                query = query.eq('department', profileData.department);
            } else {
                query = query.eq('employee_id', profileData.id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;

            const allFetched = data || [];
            setAllRequests(allFetched);

            // Filter only pending or changes_requested for the ACTIVE list
            setRequests(allFetched.filter(r => ['pending', 'changes_requested'].includes(r.status)));

            // Calculate MTD (Month to Date) Completed
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const completedThisMonth = allFetched.filter(r =>
                ['approved', 'rejected'].includes(r.status) &&
                new Date(r.created_at) >= startOfMonth
            );
            setMtdCount(completedThisMonth.length);

        } catch (err) {
            console.error('Error fetching requests:', err);
        }
    };

    const trendStats = useMemo(() => {
        const now = new Date();

        // Daily: Last 7 days
        const daily = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const label = d.toLocaleDateString('en-US', { weekday: 'short' });
            const count = allRequests.filter(r => {
                const rd = new Date(r.created_at);
                return rd.toDateString() === d.toDateString();
            }).length;
            return { label, val: count };
        });

        // Monthly: Jan to Dec of current year
        const monthly = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), i, 1);
            const label = d.toLocaleDateString('en-US', { month: 'short' });
            const count = allRequests.filter(r => {
                const rd = new Date(r.created_at);
                return rd.getMonth() === i && rd.getFullYear() === now.getFullYear();
            }).length;
            return { label, val: count };
        });

        // Yearly: Last 3 years
        const yearly = Array.from({ length: 3 }, (_, i) => {
            const year = now.getFullYear() - (2 - i);
            const count = allRequests.filter(r => new Date(r.created_at).getFullYear() === year).length;
            return { label: year.toString(), val: count };
        });

        return { daily, monthly, yearly };
    }, [allRequests]);

    const stats = [
        { label: 'Pending Review', count: requests.filter(r => r.status === 'pending').length, color: '#f59e0b', icon: Clock },
        { label: 'Needs Action', count: requests.filter(r => r.status === 'changes_requested').length, color: '#2563eb', icon: AlertTriangle },
        { label: 'Completed (MTD)', count: mtdCount, color: '#10b981', icon: CheckCircle2 },
    ];

    const currentTrend = trendStats[activeTab as keyof typeof trendStats];
    const maxVal = Math.max(...currentTrend.map(t => t.val)) || 1;

    const getStatusStyle = (status: string) => {
        if (status === 'pending') return { bg: '#fef3c7', text: '#92400e', label: 'Pending' };
        if (status === 'changes_requested') return { bg: '#dbeafe', text: '#1e40af', label: 'Changes' };
        return { bg: '#f1f5f9', text: '#475569', label: status };
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader-ring"></div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '4rem', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                        Compliance Center
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.2rem', fontWeight: 500 }}>
                        Welcome back, <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{profile?.full_name?.split(' ')[0]}</span>. There are {requests.length} audits in your queue.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/create')}
                    className="btn-primary"
                    style={{ padding: '16px 40px', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 800, gap: '12px', boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.2)' }}
                >
                    <Plus size={24} /> New Audit Request
                </button>
            </div>

            {/* Visual Analytics Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '2rem', marginBottom: '3rem' }}>
                <div className="glass-card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: '#f0f9ff', color: '#0369a1', padding: '8px', borderRadius: '10px' }}>
                                <TrendingUp size={20} />
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Audit Volume Trends</h3>
                        </div>
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                            {['daily', 'monthly', 'yearly'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    style={{
                                        background: activeTab === t ? 'white' : 'transparent',
                                        border: 'none', padding: '6px 16px', borderRadius: '8px',
                                        fontSize: '0.75rem', fontWeight: 700, color: activeTab === t ? '#0f172a' : '#64748b',
                                        cursor: 'pointer', boxShadow: activeTab === t ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                        transition: 'all 0.2s', textTransform: 'capitalize'
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px', padding: '0 10px' }}>
                        {currentTrend.map((t, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(t.val / maxVal) * 160}px` }}
                                    style={{
                                        width: '100%',
                                        maxWidth: '40px',
                                        background: 'linear-gradient(to top, #2563eb, #60a5fa)',
                                        borderRadius: '6px 6px 4px 4px',
                                        position: 'relative'
                                    }}
                                >
                                    <div className="bar-tooltip">{t.val}</div>
                                </motion.div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{t.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {stats.map((stat, i) => (
                        <div key={i} className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1.5px solid #f1f5f9' }}>
                            <div style={{ background: `${stat.color}15`, color: stat.color, padding: '12px', borderRadius: '14px' }}>
                                <stat.icon size={24} style={{ color: stat.color }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', margin: '0 0 2px 0' }}>{stat.label}</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{stat.count}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Audit Queue Section */}
            <div className="glass-card" style={{ padding: '0', border: '1.5px solid #f1f5f9', borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'white', padding: '8px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <BarChart3 size={20} color="var(--primary)" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Active Audit Queue</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="text" placeholder="Filter requests..." style={{ padding: '10px 12px 10px 36px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', width: '240px' }} />
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Entity / Description</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Department</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Value</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Health</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => {
                                const statusInfo = getStatusStyle(request.status);
                                return (
                                    <tr
                                        key={request.id}
                                        onClick={() => navigate(`/request/${request.id}`)}
                                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s' }}
                                        className="hover-row"
                                    >
                                        <td style={{ padding: '1.5rem 2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '12px', color: '#94a3b8' }}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', fontSize: '1rem' }}>{request.title}</p>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <CalendarIcon size={12} /> {new Date(request.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px' }}>
                                                {request.department}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem', fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                                            RM {request.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem' }}>
                                            <span style={{
                                                background: statusInfo.bg,
                                                color: statusInfo.text,
                                                padding: '4px 12px',
                                                borderRadius: '99px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase'
                                            }}>
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '48px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${request.ai_completeness_score || 0}%`, height: '100%', background: (request.ai_completeness_score || 0) > 80 ? '#10b981' : '#f59e0b' }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: (request.ai_completeness_score || 0) > 80 ? '#10b981' : '#f59e0b' }}>
                                                    {request.ai_completeness_score || 0}%
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                                                View <ArrowUpRight size={16} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {requests.length === 0 && (
                    <div style={{ padding: '6rem', textAlign: 'center' }}>
                        <div style={{ background: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#cbd5e1' }}>
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Queue is Clear</h3>
                        <p style={{ color: '#94a3b8', margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>No pending audits found. Good work!</p>
                    </div>
                )}
            </div>

            <style>{`
                .hover-row:hover { background: #fbfdff; }
                .hover-row:hover .bar-tooltip { opacity: 1; transform: translate(-50%, -10px); }
                
                .bar-tooltip {
                    position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
                    background: #1e293b; color: white; padding: 4px 8px; border-radius: 6px;
                    font-size: 10px; font-weight: 800; opacity: 0; transition: all 0.2s;
                    pointer-events: none; white-space: nowrap;
                }
                .bar-tooltip::after {
                    content: ''; position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%);
                    border-left: 4px solid transparent; border-right: 4px solid transparent;
                    border-top: 4px solid #1e293b;
                }

                .loader-ring {
                    width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb;
                    border-radius: 50%; animation: spin 1s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
