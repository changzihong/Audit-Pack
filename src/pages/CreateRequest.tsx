import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { analyzeRequest } from '../lib/openai';
import {
    Save, ArrowLeft, Upload, Sparkles, AlertCircle,
    CheckCircle, ShieldCheck, Trash2, Loader2, Info, Building, Wallet, Calendar, FileText, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notifyAdminsAndManagers } from '../lib/notifications';

export default function CreateRequest() {
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');
    const initialCategory = searchParams.get('category') || 'expense';

    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [navigateBack, setNavigateBack] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        category: initialCategory,
        total_amount: '',
        description: '',
        department: '',
        audit_date: new Date().toISOString().split('T')[0],
    });

    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [aiInsights, setAiInsights] = useState<{ score: number; summary: string } | null>(null);

    useEffect(() => {
        if (editId) fetchEditData();
    }, [editId]);

    // Invalidate AI analysis when form data or files change
    useEffect(() => {
        if (aiInsights) {
            setAiInsights(null);
        }
    }, [formData, files]);

    const fetchEditData = async () => {
        const { data } = await supabase.from('requests').select('*').eq('id', editId).single();
        if (data) {
            setFormData({
                title: data.title,
                category: data.category,
                total_amount: data.total_amount.toString(),
                description: data.description,
                department: data.department,
                audit_date: data.audit_date || new Date().toISOString().split('T')[0],
            });
            setAiInsights({ score: data.ai_completeness_score, summary: data.ai_summary });
            // Note: File fetch simulation not included as backend storage for files isn't set up in this context
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const runAiAnalysis = async () => {
        if (!formData.description || !formData.title || !formData.total_amount || !formData.department) {
            setValidationMessage('Please fill in all fields (Title, Amount, Department, Description) before running analysis.');
            setShowValidationModal(true);
            return;
        }

        setAnalyzing(true);

        try {
            const analysis = await analyzeRequest({
                title: formData.title,
                audit_date: formData.audit_date,
                category: formData.category,
                amount: formData.total_amount,
                description: formData.description,
                department: formData.department
            }, files.map(f => f.name));

            // Format the response for the UI
            // analyzeRequest returns { completeness_score, summary: string[], feedback: string[] }
            // We map this to { score, summary }
            const summaryText = Array.isArray(analysis.summary)
                ? analysis.summary.map((s: string) => `• ${s}`).join('\n\n')
                : analysis.summary;

            setAiInsights({
                score: analysis.completeness_score,
                summary: summaryText
            });

        } catch (error) {
            console.error("AI Analysis failed", error);
            setValidationMessage("AI service is currently unavailable. Please try again.");
            setShowValidationModal(true);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            title: formData.title,
            category: formData.category,
            total_amount: parseFloat(formData.total_amount),
            amount: parseFloat(formData.total_amount), // Required by DB schema
            sst_amount: 0,
            description: formData.description,
            department: formData.department,
            audit_date: formData.audit_date,
            employee_id: user.id,
            status: 'pending',
            ai_completeness_score: aiInsights?.score || 0,
            ai_summary: aiInsights?.summary || ''
        };

        let error;
        let createdRequestId = editId;

        if (editId) {
            const { error: err } = await supabase.from('requests').update(payload).eq('id', editId);
            error = err;
        } else {
            const { data: newReq, error: err } = await supabase.from('requests').insert([payload]).select().single();
            error = err;
            createdRequestId = newReq?.id;
        }

        if (error) {
            console.error('Error submitting request:', error);
            setValidationMessage(`Failed to create request: ${error.message}`);
            setShowValidationModal(true);
            setLoading(false);
            return;
        }

        // Notify Admins & Managers
        if (createdRequestId) {
            await notifyAdminsAndManagers(
                formData.department,
                editId ? 'resubmitted' : 'created',
                formData.title,
                createdRequestId,
                user.user_metadata?.full_name || 'An Employee'
            );
        }

        navigate('/requests');
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }} className="mobile-stack mobile-gap-4">
                <div>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1rem', fontWeight: 600 }}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }} className="mobile-h1">
                        {editId ? 'Refine Request' : 'New Audit Documentation'}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem' }} className="mobile-grid-1 tablet-stack">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={20} color="var(--primary)" /> Request Narrative
                        </h3>

                        <div className="input-group">
                            <label className="input-label">Project Title / Event Name</label>
                            <input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="input-field"
                                placeholder="e.g. Q4 Cloud Infrastructure Renewal"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }} className="mobile-grid-1">
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Audit Category</label>
                                <select
                                    className="input-field"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="expense">Expense Reimbursement</option>
                                    <option value="travel">Corporate Travel</option>
                                    <option value="purchase">Service Procurement</option>
                                    <option value="other">General Compliance</option>
                                </select>
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Department</label>
                                <select
                                    required
                                    className="input-field"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                >
                                    <option value="">Select Department</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Human Resources">Human Resources</option>
                                    <option value="Operations">Operations</option>
                                    <option value="Sales & Marketing">Sales & Marketing</option>
                                    <option value="IT Support">IT Support</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }} className="mobile-grid-1">
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Transaction Value (RM)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="input-field"
                                    value={formData.total_amount}
                                    onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Effective Date</label>
                                <input
                                    required
                                    type="date"
                                    className="input-field"
                                    value={formData.audit_date}
                                    onChange={e => setFormData({ ...formData, audit_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Detailed Business Justification</label>
                            <textarea
                                required
                                rows={6}
                                className="input-field"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{ resize: 'none' }}
                                placeholder="Explain the purpose of this expenditure for internal audit review..."
                            />
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '2rem', border: '2px dashed var(--border)', background: '#f8fafc' }}>
                        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <input
                                type="file"
                                multiple
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{ cursor: 'pointer' }}
                            >
                                <div style={{ background: 'white', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                                    <Upload size={28} color="#94a3b8" />
                                </div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 8px 0' }}>Support Evidence</h4>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Click to upload receipts or invoices</p>
                            </div>

                            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ borderRadius: '12px' }}>
                                Choose Files
                            </button>

                            {files.length > 0 && (
                                <div style={{ marginTop: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Attached Files:</p>
                                    {files.map((file, idx) => (
                                        <div key={idx} style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#334155' }}>{file.name}</span>
                                            <button type="button" onClick={() => removeFile(idx)} style={{ color: '#ef4444', background: 'none' }}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Sparkles size={18} color="#60a5fa" /> AI Verification
                            </h4>
                            {aiInsights && (
                                <div style={{ background: '#60a5fa', color: '#0f172a', padding: '4px 10px', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem' }}>
                                    {aiInsights.score}%
                                </div>
                            )}
                        </div>

                        {aiInsights ? (
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap' }}>
                                    {aiInsights.summary}
                                </p>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                                    {files.length > 0 || formData.description
                                        ? "Ready to scan for policy alignment."
                                        : "Fill in details to enable smart scan."}
                                </p>
                                <button
                                    type="button"
                                    onClick={runAiAnalysis}
                                    disabled={analyzing}
                                    style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#2563eb', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: analyzing ? 0.7 : 1 }}
                                >
                                    {analyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    {analyzing ? 'Analyzing Request...' : 'Run Analysis'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '24px', border: '1px solid #fde68a', display: 'flex', gap: '12px' }}>
                        <Info size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', fontWeight: 500, lineHeight: 1.5 }}>
                            All submissions are final and strictly monitored by internal compliance protocols.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ width: '100%', padding: '20px', borderRadius: '20px', fontSize: '1.1rem', fontWeight: 900, gap: '12px' }}
                    >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                        {loading ? 'Processing...' : (editId ? 'Resubmit Request' : 'Submit for Review')}
                    </button>

                    {editId && (
                        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Editing: {editId.slice(0, 8)}</p>
                    )}
                </div>
            </form>

            {/* VALIDATION MODAL */}
            <AnimatePresence>
                {showValidationModal && (
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
                                background: 'white', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '400px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', textAlign: 'center'
                            }}
                        >
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '20px', background: '#fef2f2', color: '#dc2626',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
                            }}>
                                <AlertCircle size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                                Missing Details
                            </h3>
                            <p style={{ color: '#64748b', margin: '0 0 2rem 0', lineHeight: 1.5 }}>
                                {validationMessage}
                            </p>
                            <button
                                onClick={() => setShowValidationModal(false)}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: '#0f172a',
                                    color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem'
                                }}
                            >
                                OK, I'll fix it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .loader-ring { width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
