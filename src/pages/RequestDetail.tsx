import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ArrowLeft, Clock, CheckCircle2, XCircle, MessageSquare,
    FileText, History, User, Check, X, AlertTriangle, Send, Loader2, Info, Sparkles, PartyPopper,
    Trash2, Edit3, Download, ShieldCheck, Building, Wallet, Calendar
} from 'lucide-react';
import { AuditRequest, Profile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { sendEmailNotification } from '../lib/notifications';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function RequestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const reportRef = useRef<HTMLDivElement>(null);
    const [request, setRequest] = useState<(AuditRequest & { profiles?: { full_name: string } }) | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState<string | null>(null);
    const [unauthorized, setUnauthorized] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);
            if (profileData) {
                await fetchRequestWithAccess(profileData);
            }
        }
        await fetchComments();
        setLoading(false);
    };

    const fetchRequestWithAccess = async (userProfile: Profile) => {
        const { data, error } = await supabase
            .from('requests')
            .select('*, profiles:employee_id(full_name)')
            .eq('id', id)
            .single();

        if (error || !data) {
            setRequest(null);
            return;
        }

        const canView = userProfile.role === 'admin' ||
            (userProfile.role === 'manager' && userProfile.department === data.department) ||
            (userProfile.id === data.employee_id);

        if (!canView) {
            setUnauthorized(true);
            return;
        }

        setRequest(data);
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
            await fetchRequestOnly();
            await handlePostComment(`Status updated to ${newStatus.replace('_', ' ')}`, true);

            // Send Email Notification
            if (request) {
                await sendEmailNotification(request.employee_id, newStatus, request.title);
            }

            setShowSuccess(newStatus);
            setTimeout(() => setShowSuccess(null), 3000);
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status.');
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
            await supabase.from('comments').insert({
                request_id: id,
                user_id: user?.id,
                content: content.trim()
            });
            if (!text) setCommentText('');
            fetchComments();
        } catch (err) {
            console.error('Error posting comment:', err);
        } finally {
            if (!text) setPosting(false);
        }
    };

    const handleDelete = async () => {
        // ACTUAL DELETION LOGIC (Triggered by Modal)
        setActionLoading('deleting');
        try {
            await supabase.from('comments').delete().eq('request_id', id);
            await supabase.from('requests').delete().eq('id', id);
            navigate(-1);
        } catch (err) {
            console.error('Error deleting:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownloadPDF = () => {
        if (!reportRef.current) return;
        setIsGeneratingPDF(true);

        const element = reportRef.current;
        const opt = {
            margin: 10,
            filename: `Audit_Report_${request?.title.replace(/\s+/g, '_')}_${id?.slice(0, 8)}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        html2pdf().from(element).set(opt).save().then(() => {
            setIsGeneratingPDF(false);
        });
    };

    const statusMap: Record<string, any> = {
        pending: { label: 'Pending Review', color: '#f59e0b', bg: '#fffbeb', icon: Clock },
        approved: { label: 'Approved', color: '#10b981', bg: '#f0fdf4', icon: CheckCircle2 },
        rejected: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2', icon: XCircle },
        changes_requested: { label: 'Needs Action', color: '#3b82f6', bg: '#eff6ff', icon: AlertTriangle },
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader-ring"></div>
        </div>
    );

    if (unauthorized) return (
        <div style={{ textAlign: 'center', padding: '10rem 2rem' }} className="mobile-p-md">
            <div style={{ background: '#fef2f2', color: '#dc2626', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <ShieldCheck size={40} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }} className="mobile-h2">Restricted Access</h1>
            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto 2rem' }}>You do not have permission to view this request.</p>
            <button onClick={() => navigate(-1)} className="btn-primary" style={{ padding: '12px 30px', borderRadius: '14px' }}>Go Back</button>
        </div>
    );

    if (!request) return <div>Request not found</div>;

    const currentStatus = statusMap[request.status] || statusMap.pending;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '5rem' }}>
            <AnimatePresence>
                {showSuccess && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 100, background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#d1fae5', color: '#059669', padding: '10px', borderRadius: '12px' }}><PartyPopper size={24} /></div>
                        <div><h4 style={{ margin: 0, fontWeight: 700 }}>Request Updated</h4></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SCREEN NAVIGATION */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }} className="mobile-stack mobile-gap-4">
                <button
                    onClick={() => navigate(-1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                    <ArrowLeft size={18} /> Back
                </button>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }} className="mobile-full">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        className="btn-secondary mobile-full"
                        style={{ padding: '10px 20px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, justifyContent: 'center' }}
                    >
                        {isGeneratingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        <span className="mobile-hide">{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
                        <span className="mobile-show">PDF</span>
                    </button>
                    {isOwner && request.status === 'changes_requested' && (
                        <button onClick={() => navigate(`/create?id=${request.id}`)} className="btn-primary mobile-full" style={{ padding: '10px 20px', borderRadius: '12px' }}>
                            <Edit3 size={18} /> Edit
                        </button>
                    )}
                    {canAction && request.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }} className="mobile-full">
                            <button onClick={() => handleAction('changes_requested')} disabled={!!actionLoading} className="btn-action-change mobile-full" style={{ padding: '10px 18px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {actionLoading === 'changes_requested' ? <Loader2 className="animate-spin" size={18} /> : <AlertTriangle size={18} />}
                                {actionLoading === 'changes_requested' ? '' : 'Request Changes'}
                            </button>
                            <button onClick={() => handleAction('rejected')} disabled={!!actionLoading} className="btn-action-reject mobile-full" style={{ padding: '10px 18px', borderRadius: '12px' }}>
                                {actionLoading === 'rejected' ? <Loader2 className="animate-spin" size={18} /> : 'Reject'}
                            </button>
                            <button onClick={() => handleAction('approved')} disabled={!!actionLoading} className="btn-action-approve mobile-full" style={{ padding: '10px 18px', borderRadius: '12px' }}>
                                {actionLoading === 'approved' ? <Loader2 className="animate-spin" size={18} /> : 'Approve'}
                            </button>
                        </div>
                    )}
                    {isAdmin && (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="btn-action-reject mobile-full"
                            style={{ padding: '10px 18px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }}
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN DASHBOARD UI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem' }} className="mobile-grid-1">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Header Card */}
                    <div className="glass-card" style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }} className="mobile-stack mobile-gap-4">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                    <div style={{ background: currentStatus.bg, color: currentStatus.color, padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <currentStatus.icon size={14} /> {currentStatus.label}
                                    </div>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>#{id?.slice(0, 8)}</span>
                                </div>
                                <h1 style={{ fontSize: '2.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', lineHeight: 1.1 }} className="mobile-h1">{request.title}</h1>
                                <p style={{ color: '#64748b', fontSize: '1.2rem', fontWeight: 500 }}>{request.category.toUpperCase()} • {request.department}</p>
                            </div>
                            <div style={{ textAlign: 'right', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9' }} className="mobile-full mobile-text-left">
                                <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Total Amount</p>
                                <p style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>RM {request.total_amount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FileText size={20} color="var(--primary)" /> Justification
                            </h3>
                            <div style={{ color: '#475569', lineHeight: 1.8, fontSize: '1.1rem', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                {request.description}
                            </div>
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div className="glass-card" style={{ padding: '2.5rem', background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)', border: '1px solid #bae6fd' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0369a1', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Sparkles size={22} /> AI Review
                            </h3>
                            <div style={{ background: '#0369a1', color: 'white', padding: '6px 14px', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 900 }}>
                                {request.ai_completeness_score}%
                            </div>
                        </div>
                        <div style={{ background: 'white', padding: '1.75rem', borderRadius: '20px', border: '1.5px solid #e0f2fe', color: '#1e40af', lineHeight: 1.7, fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                            {request.ai_summary || "AI Engine is analyzing compliance status..."}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Audit Info</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} color="#64748b" /></div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>PREPARED BY</p>
                                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{request.profiles?.full_name}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building size={18} color="#64748b" /></div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>DEPARTMENT</p>
                                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{request.department}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', textTransform: 'uppercase' }}>Timeline</h4>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                            {comments.map((comment, i) => (
                                <div key={i} style={{ padding: '12px', background: comment.content.includes('Status updated') ? '#f8fafc' : 'white', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{comment.profiles?.full_name?.split(' ')[0]}</span>
                                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>{comment.content}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Note..." style={{ width: '100%', padding: '12px 40px 12px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }} />
                            <button onClick={() => handlePostComment()} disabled={posting || !commentText.trim()} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                                {posting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF TEMPLATE */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}>
                <div ref={reportRef} style={{ background: 'white', padding: '40px', minHeight: '1000px', border: '2px solid #000' }}>
                    {/* Official template content same as before but ensured it exists here for capture */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #000', paddingBottom: '20px', marginBottom: '40px' }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <ShieldCheck size={40} />
                            <div>
                                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>AUDIT PACK MALAYSIA</h1>
                                <p style={{ margin: 0, fontSize: '10px' }}>OFFICIAL VERIFICATION REPORT • ID: {id}</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>{request.status.toUpperCase()}</h2>
                            <p style={{ margin: 0, fontSize: '12px' }}>{new Date().toLocaleDateString('en-MY')}</p>
                        </div>
                    </div>
                    <h2 style={{ fontSize: '32px', marginBottom: '30px' }}>{request.title}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                        <div style={{ border: '1px solid #eee', padding: '20px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 800, color: '#888' }}>PREPARED BY</p>
                            <p style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{request.profiles?.full_name}</p>
                            <p style={{ fontSize: '14px', margin: 0 }}>{request.department} Department</p>
                        </div>
                        <div style={{ border: '1px solid #eee', padding: '20px', textAlign: 'right' }}>
                            <p style={{ fontSize: '10px', fontWeight: 800, color: '#888' }}>TOTAL VALUE</p>
                            <p style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>RM {request.total_amount.toLocaleString()}</p>
                        </div>
                    </div>
                    <div>
                        <h4 style={{ borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>DESCRIPTION</h4>
                        <div style={{ fontSize: '14px', lineHeight: 1.6 }}>{request.description}</div>
                    </div>
                    <div style={{ marginTop: '50px', background: '#f8fafc', padding: '20px' }}>
                        <h4 style={{ margin: 0 }}>AI SCORE: {request.ai_completeness_score}%</h4>
                        <p style={{ fontSize: '12px' }}>{request.ai_summary}</p>
                    </div>
                    <div style={{ marginTop: '100px', textAlign: 'center', borderTop: '1px solid #000', paddingTop: '10px' }}>
                        <p style={{ fontSize: '10px' }}>STRICTLY CONFIDENTIAL • © 2025 AUDIT PACK MALAYSIA</p>
                    </div>
                </div>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {showDeleteConfirm && (
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
                                Delete Request?
                            </h3>
                            <p style={{ textAlign: 'center', color: '#64748b', margin: '0 0 2rem 0', lineHeight: 1.5 }}>
                                This action cannot be undone. This will permanently delete the audit request and all associated data.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    style={{
                                        padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white',
                                        color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '1rem'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        padding: '12px', borderRadius: '14px', border: 'none', background: '#ef4444',
                                        color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {actionLoading === 'deleting' ? <Loader2 className="animate-spin" size={20} /> : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .btn-action-approve { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; font-weight: 800; cursor: pointer; }
                .btn-action-reject { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; font-weight: 800; cursor: pointer; }
                .btn-action-change:hover { background: #dbeafe !important; }
                .loader-ring { width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
