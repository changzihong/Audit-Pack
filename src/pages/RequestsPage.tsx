import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Plus, Clock, FileText, Search, BarChart3,
    ArrowUpRight, Calendar as CalendarIcon, Wallet,
    Plane, Briefcase, PlusCircle, CheckCircle2, User
} from 'lucide-react';
import { AuditRequest, Profile } from '../types';
import { motion } from 'framer-motion';

export default function RequestsPage() {
    const [requests, setRequests] = useState<AuditRequest[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const formTypes = [
        { id: 'expense', label: 'Expense Claim', icon: Wallet, color: '#2563eb', desc: 'Reimburse company expenses & receipts' },
        { id: 'travel', label: 'Travel Req', icon: Plane, color: '#8b5cf6', desc: 'Flights, hotels and per-diem approvals' },
        { id: 'purchase', label: 'Purchase Order', icon: Briefcase, color: '#10b981', desc: 'Hardware, software or services procurement' },
        { id: 'other', label: 'Other Audit', icon: PlusCircle, color: '#64748b', desc: 'General compliance or custom requests' },
    ];

    useEffect(() => {
        fetchProfileAndRequests();
    }, []);

    const fetchProfileAndRequests = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);
            if (profileData) {
                let query = supabase.from('requests').select('*, profiles:employee_id(full_name)');
                if (profileData.role === 'manager') {
                    // Managers see dept requests OR their own requests
                    query = query.or(`department.eq.${profileData.department},employee_id.eq.${profileData.id}`);
                } else if (profileData.role === 'employee') {
                    query = query.eq('employee_id', profileData.id);
                }
                const { data } = await query.order('created_at', { ascending: false });
                setRequests((data || []).filter(r => ['pending', 'changes_requested'].includes(r.status)));
            }
        }
        setLoading(false);
    };

    const getStatusStyle = (status: string) => {
        if (status === 'pending') return { bg: '#fef3c7', text: '#92400e', label: 'Pending' };
        if (status === 'changes_requested') return { bg: '#dbeafe', text: '#1e40af', label: 'Changes' };
        return { bg: '#f1f5f9', text: '#475569', label: status };
    };

    const filteredRequests = requests.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader-ring"></div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }} className="mobile-h1">Request Center</h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }} className="mobile-hide">Submit new documentation or track your active audit queue.</p>
            </div>

            {/* Form Selection Grid */}
            <div style={{ marginBottom: '4rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlusCircle size={20} color="var(--primary)" /> Initiate New Request
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {formTypes.map((type) => (
                        <motion.div
                            key={type.id}
                            whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                            onClick={() => navigate(`/create?category=${type.id}`)}
                            style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '24px',
                                border: '1.5px solid #f1f5f9',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}
                        >
                            <div style={{ background: `${type.color}15`, color: type.color, width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <type.icon size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{type.label}</h4>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>{type.desc}</p>
                            </div>
                            <div style={{ marginTop: '0.5rem', color: type.color, fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Open Form <ArrowUpRight size={14} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Audit Queue Table */}
            <div className="glass-card" style={{ padding: '0', border: '1.5px solid #f1f5f9', borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }} className="mobile-stack mobile-gap-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'white', padding: '8px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <BarChart3 size={20} color="var(--primary)" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Active Queue</h2>
                    </div>
                    <div style={{ position: 'relative' }} className="mobile-full">
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '10px 12px 10px 36px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}
                            className="mobile-full"
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
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
                            {filteredRequests.map((request) => {
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
                                                <div className="mobile-hide" style={{ padding: '10px', background: '#f8fafc', borderRadius: '12px', color: '#94a3b8' }}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', fontSize: '1rem' }}>{request.title}</p>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarIcon size={12} /> {new Date(request.created_at).toLocaleDateString()}</span>
                                                        <span style={{ color: '#e2e8f0' }}>|</span>
                                                        <span style={{ fontWeight: 600 }}>{(request as any).profiles?.full_name?.split(' ')[0]}</span>
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
                                            RM {request.total_amount.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem' }}>
                                            <span style={{
                                                background: statusInfo.bg, color: statusInfo.text, padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
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

                {filteredRequests.length === 0 && (
                    <div style={{ padding: '6rem', textAlign: 'center' }} className="mobile-p-md">
                        <div style={{ background: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#cbd5e1' }}>
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Queue is Clear</h3>
                        <p style={{ color: '#94a3b8', margin: 0, fontWeight: 500 }}>No pending audits found. Good work!</p>
                    </div>
                )}
            </div>

            <style>{`
                .hover-row:hover { background: #fbfdff; }
                .loader-ring { width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
