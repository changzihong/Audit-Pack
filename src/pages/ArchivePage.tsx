import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    CheckCircle2, XCircle, FileText, ArrowUpRight, Search,
    Archive as ArchiveIcon, Calendar, Building2, User, Trash2, Loader2
} from 'lucide-react';
import { AuditRequest, Profile } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

export default function ArchivePage() {
    const [requests, setRequests] = useState<AuditRequest[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfileAndRequests();
    }, []);

    const fetchProfileAndRequests = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profileData);

            let query = supabase.from('requests').select('*, profiles:employee_id(full_name)');

            // Only COMPLETED requests
            query = query.in('status', ['approved', 'rejected']);

            if (profileData.role === 'admin') {
                // Admins see all
            } else if (profileData.role === 'manager') {
                query = query.eq('department', profileData.department);
            } else {
                query = query.eq('employee_id', user.id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error('Error fetching archive:', err);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmationId) return;

        setDeletingId(deleteConfirmationId);
        try {
            // Cascade delete should handle comments if set up, but we'll be safe
            await supabase.from('comments').delete().eq('request_id', deleteConfirmationId);
            const { error } = await supabase.from('requests').delete().eq('id', deleteConfirmationId);
            if (error) throw error;
            setRequests(requests.filter(r => r.id !== deleteConfirmationId));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete audit.');
        } finally {
            setDeletingId(null);
            setDeleteConfirmationId(null);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmationId(id);
    };

    const getStatusBadge = (status: string) => {
        const isApproved = status === 'approved';
        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: isApproved ? '#059669' : '#dc2626',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                {isApproved ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {status}
            </span>
        );
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader-ring"></div>
        </div>
    );

    const isAdmin = profile?.role === 'admin';

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#f1f5f9', color: '#64748b', padding: '10px', borderRadius: '12px' }}>
                        <ArchiveIcon size={24} />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }} className="mobile-h1">Audit Archive</h1>
                </div>
                <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }} className="mobile-hide">
                    Historical record of all completed compliance reviews.
                </p>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1.5px solid #f1f5f9', borderRadius: '24px' }}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="mobile-stack mobile-gap-4 mobile-p-md">
                    <div style={{ position: 'relative', width: '320px' }} className="mobile-full">
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" placeholder="Search archives..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Audit Request</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date Processed</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amount</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Result</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr key={request.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }} className="hover:bg-slate-50">
                                    <td style={{ padding: '1.5rem 2rem' }}>
                                        <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', fontSize: '0.95rem' }}>{request.title}</p>
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={12} /> {request.department}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {(request as any).profiles?.full_name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem 2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>
                                            <Calendar size={16} color="#94a3b8" />
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem 2rem', fontWeight: 800, color: '#0f172a' }}>
                                        RM {request.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '1.5rem 2rem' }}>
                                        {getStatusBadge(request.status)}
                                    </td>
                                    <td style={{ padding: '1.5rem 2rem' }}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => navigate(`/request/${request.id}`)}
                                                style={{ padding: '8px 16px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                                            >
                                                Details
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteClick(request.id)}
                                                    disabled={deletingId === request.id}
                                                    style={{ padding: '8px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer' }}
                                                >
                                                    {deletingId === request.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {requests.length === 0 && (
                    <div style={{ padding: '6rem', textAlign: 'center' }} className="mobile-p-md">
                        <ArchiveIcon size={48} style={{ color: '#e2e8f0', marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Archive is Empty</h3>
                        <p style={{ color: '#94a3b8', margin: 0, fontWeight: 500 }}>Once requests are approved or rejected, they will appear here.</p>
                    </div>
                )}
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {deleteConfirmationId && (
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
                            style={{
                                background: 'white', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '400px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}
                        >
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '20px', background: '#fef2f2', color: '#dc2626',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
                            }}>
                                <Trash2 size={32} />
                            </div>
                            <h3 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                                Delete Archive?
                            </h3>
                            <p style={{ textAlign: 'center', color: '#64748b', margin: '0 0 2rem 0', lineHeight: 1.5 }}>
                                This action cannot be undone. This record will be permanently removed from the database.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button
                                    onClick={() => setDeleteConfirmationId(null)}
                                    style={{
                                        padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white',
                                        color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '1rem'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    style={{
                                        padding: '12px', borderRadius: '14px', border: 'none', background: '#ef4444',
                                        color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {deletingId ? <Loader2 className="animate-spin" size={20} /> : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
              .loader-ring {
                width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb;
                border-radius: 50%; animation: spin 1s linear infinite;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
