import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ArrowLeft, Clock, CheckCircle2, XCircle, MessageSquare,
    FileText, History, User, Check, X, AlertTriangle, Send, Loader2, Info, Sparkles, PartyPopper,
    Trash2, RefreshCcw, Edit3, Download
} from 'lucide-react';
import { AuditRequest, Profile, Comment } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export default function RequestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState<(AuditRequest & { profiles?: { full_name: string } }) | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'comments', filter: `request_id=eq.${id}` },
                () => { fetchComments(); }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'requests', filter: `id=eq.${id}` },
                () => { fetchRequestOnly(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchRequestOnly(), fetchComments(), fetchProfile()]);
        setLoading(false);
    };

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(data);
        }
    };

    const fetchRequestOnly = async () => {
        const { data } = await supabase
            .from('requests')
            .select('*, profiles:employee_id(full_name)')
            .eq('id', id)
            .single();
        if (data) setRequest(data);
    };

    const fetchComments = async () => {
        const { data } = await supabase
            .from('comments')
            .select('*, profiles(full_name, role)')
            .eq('request_id', id)
            .order('created_at', { ascending: true });
        if (data) setComments(data);
    };

    const isAdmin = profile?.role === 'admin';
    const isManager = profile?.role === 'manager';
    const isOwner = profile?.id === request?.employee_id;
    const canAction = isAdmin || (isManager && profile?.department === request?.department);

    const handleAction = async (newStatus: string) => {
        if (actionLoading) return;
        setActionLoading(newStatus);
        try {
            const { error } = await supabase
                .from('requests')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Status updates are now exclusively handled by notifications (Bell Icon)
            setShowSuccess(newStatus);
            setTimeout(() => setShowSuccess(null), 3000);

        } catch (err) {
            console.error('Error updating status:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownloadReport = () => {
        window.print();
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to permanently delete this request? This action cannot be undone.')) return;

        setActionLoading('deleting');
        try {
            await supabase.from('comments').delete().eq('request_id', id);
            const { error } = await supabase.from('requests').delete().eq('id', id);

            if (error) throw error;
            navigate('/dashboard');
        } catch (err) {
            console.error('Error deleting request:', err);
            alert('Could not delete request.');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePostComment = async (text?: string, isSystem = false) => {
        const content = text || commentText;
        if (!content.trim()) return;

        if (!text) setPosting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('comments').insert({
                request_id: id,
                user_id: user?.id,
                content: content.trim()
            });

            if (error) throw error;
            if (!text) setCommentText('');
            fetchComments();
        } catch (err) {
            console.error('Error posting comment:', err);
        } finally {
            if (!text) setPosting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, any> = {
            pending: { bg: '#fef3c7', text: '#d97706', icon: Clock },
            approved: { bg: '#d1fae5', text: '#059669', icon: CheckCircle2 },
            rejected: { bg: '#fee2e2', text: '#dc2626', icon: XCircle },
            changes_requested: { bg: '#dbeafe', text: '#2563eb', icon: AlertTriangle },
        };
        const style = styles[status] || styles.pending;
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: style.bg, color: style.text, padding: '6px 14px',
                borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
                <style.icon size={14} />
                {status.replace('_', ' ')}
            </span>
        );
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader-ring"></div>
        </div>
    );

    if (!request) return <div>Request not found</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{
                            position: 'fixed', top: '100px', right: '40px', zIndex: 100,
                            background: 'white', padding: '1.5rem 2rem', borderRadius: '20px',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
                            display: 'flex', alignItems: 'center', gap: '1rem'
                        }}
                    >
                        <div style={{
                            background: showSuccess === 'approved' ? '#d1fae5' : showSuccess === 'rejected' ? '#fee2e2' : '#e0f2fe',
                            color: showSuccess === 'approved' ? '#059669' : showSuccess === 'rejected' ? '#dc2626' : '#2563eb',
                            padding: '10px', borderRadius: '12px'
                        }}>
                            {showSuccess === 'approved' ? <PartyPopper size={24} /> : showSuccess === 'rejected' ? <XCircle size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Action Successful</h4>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Request is now <strong>{showSuccess.replace('_', ' ')}</strong></p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => navigate('/dashboard')}
                className="no-print"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', background: 'none', border: 'none', marginBottom: '2rem', fontWeight: 600, cursor: 'pointer' }}
            >
                <ArrowLeft size={18} /> Back to Audit Queue
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2.5rem' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                        {getStatusBadge(request.status)}
                        <span style={{ color: '#e2e8f0' }}>|</span>
                        <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Audit ID: #{request.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{request.title}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={14} />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {request.profiles?.full_name || `Employee #${request.employee_id.slice(0, 5)}`} • {new Date(request.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </div>

                <div className="no-print" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: '2rem' }}>
                    {isAdmin && (request.status === 'approved' || request.status === 'rejected') && (
                        <button onClick={() => handleAction('changes_requested')} disabled={!!actionLoading} className="btn-action-warn" style={{ padding: '10px 16px', borderRadius: '12px' }}>
                            {actionLoading === 'changes_requested' ? <Loader2 className="animate-spin" size={18} /> : <><RefreshCcw size={18} /> Re-open</>}
                        </button>
                    )}

                    {isAdmin && (request.status === 'approved' || request.status === 'rejected') && (
                        <button onClick={handleDelete} disabled={!!actionLoading} className="btn-action-reject" style={{ padding: '10px 16px', borderRadius: '12px' }}>
                            {actionLoading === 'deleting' ? <Loader2 className="animate-spin" size={18} /> : <><Trash2 size={18} /> Delete</>}
                        </button>
                    )}

                    <button onClick={handleDownloadReport} className="btn-secondary" style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', background: 'white', border: '1.5px solid #e2e8f0', fontWeight: 700 }}>
                        <Download size={18} /> Report
                    </button>

                    {isOwner && request.status === 'changes_requested' && (
                        <button onClick={() => navigate(`/create?id=${request.id}`)} className="btn-primary" style={{ padding: '10px 16px', borderRadius: '12px' }}>
                            <Edit3 size={18} /> Edit & Resubmit
                        </button>
                    )}

                    {canAction && request.status === 'pending' && (
                        <>
                            <button onClick={() => handleAction('rejected')} disabled={!!actionLoading} className="btn-action-reject" style={{ padding: '10px 18px', borderRadius: '12px' }}>
                                {actionLoading === 'rejected' ? <Loader2 className="animate-spin" size={18} /> : <><X size={18} /> Reject</>}
                            </button>
                            <button onClick={() => handleAction('changes_requested')} disabled={!!actionLoading} className="btn-action-warn" style={{ padding: '10px 18px', borderRadius: '12px' }}>
                                {actionLoading === 'changes_requested' ? <Loader2 className="animate-spin" size={18} /> : <><AlertTriangle size={18} /> Need Changes</>}
                            </button>
                            <button onClick={() => handleAction('approved')} disabled={!!actionLoading} className="btn-action-approve" style={{ padding: '10px 18px', borderRadius: '12px' }}>
                                {actionLoading === 'approved' ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Approve</>}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Main Details */}
                    <div className="glass-card" style={{ padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                            <FileText size={22} style={{ color: 'var(--primary)' }} /> Request Overview
                        </h3>
                        <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '2.5rem', whiteSpace: 'pre-wrap', fontSize: '1.05rem' }}>
                            {request.description}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Category</p>
                                <p style={{ fontWeight: 700, color: '#1e293b', margin: 0, textTransform: 'capitalize' }}>{request.category.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Department</p>
                                <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{request.department}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Total Amount</p>
                                <p style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '1.1rem' }}>RM {request.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Smart Insight - CLEANER VERSION */}
                    {request.ai_completeness_score !== undefined && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '2.5rem', background: 'linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)', border: '1.5px solid #dbeafe', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1.5rem' }}>
                                <Sparkles size={80} style={{ color: '#dbeafe', opacity: 0.3 }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '12px' }}>
                                    <Sparkles size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>Smart AI Audit Analysis</h3>
                                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2563eb' }}>{request.ai_completeness_score}%</div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Compliance Score</div>
                                </div>
                            </div>

                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                                <p style={{ color: '#334155', lineHeight: 1.7, margin: 0, fontSize: '1.05rem', fontWeight: 500 }}>
                                    {request.ai_summary}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Comments & Discussion */}
                    <div className="glass-card no-print" style={{ padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                            <MessageSquare size={22} style={{ color: 'var(--primary)' }} /> Audit Discussion & Feed
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            {comments.map((c) => {
                                const isSystem = c.content.includes('Status updated to');
                                return (
                                    <div key={c.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                        {!isSystem && (
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '12px',
                                                background: c.profiles?.role === 'admin' ? '#1e293b' : c.profiles?.role === 'manager' ? '#2563eb' : '#f1f5f9',
                                                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.profiles?.role === 'employee' ? '#64748b' : 'white', fontSize: '12px', fontWeight: 800
                                            }}>
                                                {c.profiles?.full_name?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                        <div style={{
                                            background: isSystem ? '#f8fafc' : '#ffffff',
                                            padding: isSystem ? '12px 20px' : '16px 20px',
                                            borderRadius: isSystem ? '12px' : '16px',
                                            flex: 1, border: isSystem ? '1px dashed #e2e8f0' : '1px solid #eef2f6'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSystem ? '#94a3b8' : '#1e293b' }}>
                                                    {isSystem ? 'System Log' : (c.profiles?.full_name || 'Team Member')}
                                                    {!isSystem && <span style={{ fontWeight: 600, color: '#94a3b8', marginLeft: '8px', fontSize: '0.75rem' }}>• {c.profiles?.role}</span>}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p style={{ fontSize: isSystem ? '0.8125rem' : '0.95rem', color: isSystem ? '#64748b' : '#334155', margin: 0 }}>{c.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ position: 'relative' }}>
                            <textarea
                                className="input-field"
                                rows={3}
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                style={{ padding: '16px 120px 16px 20px', borderRadius: '16px' }}
                                disabled={posting}
                            />
                            <button
                                onClick={() => handlePostComment()}
                                disabled={posting || !commentText.trim()}
                                style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                            >
                                {posting ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Post</>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <History size={18} style={{ color: 'var(--primary)' }} /> Support Documents
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {request.attachments?.map((file, i) => (
                                <div key={i} className="attachment-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                    <div style={{ background: 'white', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '1px solid #eef2f6' }}>
                                        <FileText size={18} />
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file}</p>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Verified Support</p>
                                    </div>
                                </div>
                            ))}
                            {(!request.attachments || request.attachments.length === 0) && (
                                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0' }}>No attachments uploaded</p>
                            )}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '2rem', background: '#0f172a', color: 'white' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Info size={18} style={{ color: '#60a5fa' }} /> Audit Notice
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
                            This audit is subject to Malaysian corporate tax regulations. All supporting documents must be kept for 7 years.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .loader-ring {
                    width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb;
                    border-radius: 50%; animation: spin 1s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                
                @media print {
                    .no-print, header, aside, nav, button, textarea { display: none !important; }
                    .glass-card { background: white !important; border: 1px solid #eee !important; box-shadow: none !important; margin: 0; }
                    body { background: white !important; padding: 0 !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    h1 { font-size: 2rem !important; margin-top: 0 !important; }
                    .print-header { display: block !important; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 2rem; }
                }
            `}</style>
        </div>
    );
}
