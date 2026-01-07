import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { analyzeRequest } from '../lib/openai';
import {
    Building2, Info, Upload, Sparkles, Loader2,
    AlertCircle, CheckCircle2, ArrowRight, PartyPopper, Check, Calendar, FileText, X, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateRequest() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!editId);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<any>(null);
    const [userDept, setUserDept] = useState('Engineering');
    const [showSuccess, setShowSuccess] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        category: 'expense',
        customCategory: '',
        amount: '',
        description: '',
        department: 'Engineering',
        audit_date: new Date().toISOString().split('T')[0]
    });

    const categories = [
        { id: 'expense', label: 'Expense Claim' },
        { id: 'travel', label: 'Travel Reimbursement' },
        { id: 'purchase', label: 'Purchase Requisition' },
        { id: 'other', label: 'Other' },
    ];

    const departments = [
        'Engineering', 'Finance & Accounting', 'Human Resources',
        'Operations', 'Sales & Marketing', 'IT Support'
    ];

    useEffect(() => {
        fetchUserDept();
        if (editId) fetchExistingRequest();
    }, [editId]);

    const fetchUserDept = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('department').eq('id', user.id).single();
            if (data?.department) {
                setUserDept(data.department);
                if (!editId) setFormData(prev => ({ ...prev, department: data.department }));
            }
        }
    };

    const fetchExistingRequest = async () => {
        try {
            const { data, error } = await supabase.from('requests').select('*').eq('id', editId).single();
            if (error) throw error;
            if (data) {
                setFormData({
                    title: data.title,
                    category: data.category,
                    customCategory: (data.category === 'other' ? data.description.match(/\(Custom Category: (.*)\)/)?.[1] || '' : ''),
                    amount: data.amount.toString(),
                    description: data.description.replace(/\n\(Custom Category: .*\)/, ''),
                    department: data.department,
                    audit_date: data.audit_date || new Date().toISOString().split('T')[0]
                });
                // Handle existing attachment names if needed as visual-only
            }
        } catch (err) {
            console.error('Error fetching request for edit:', err);
        } finally {
            setFetching(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleAIAnalysis = async () => {
        if (!formData.title || !formData.description) return;
        setAnalyzing(true);
        try {
            const fileNames = attachments.map(f => f.name);
            const result = await analyzeRequest(formData, fileNames);
            setAiFeedback(result);
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const fileNames = attachments.map(f => f.name);
            const finalDescription = formData.description + (formData.category === 'other' ? `\n(Custom Category: ${formData.customCategory})` : '');

            const payload = {
                title: formData.title,
                category: formData.category,
                amount: parseFloat(formData.amount),
                total_amount: parseFloat(formData.amount) || 0,
                description: finalDescription,
                status: 'pending',
                department: formData.department,
                ai_completeness_score: aiFeedback?.completeness_score || 0,
                ai_summary: aiFeedback?.summary?.join(' • ') || 'Compliance check pending re-evaluation.',
                audit_date: formData.audit_date,
                attachments: fileNames
            };

            let error;
            if (editId) {
                const { error: updateError } = await supabase.from('requests').update(payload).eq('id', editId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('requests').insert({ ...payload, employee_id: user?.id });
                error = insertError;
            }

            if (error) throw error;
            setShowSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2500);
        } catch (err) {
            console.error('Submission Error:', err);
            alert('Error submitting request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader-ring"></div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(15, 23, 42, 0.8)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{
                                background: 'white', padding: '3rem', borderRadius: '32px',
                                maxWidth: '440px', width: '100%', textAlign: 'center',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                            }}
                        >
                            <div style={{
                                width: '80px', height: '80px', background: '#d1fae5', color: '#059669',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 2rem', boxShadow: '0 0 0 10px rgba(209, 250, 229, 0.3)'
                            }}>
                                <PartyPopper size={40} />
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>{editId ? 'Resubmitted!' : 'Audit Submitted!'}</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                                Your audit request has been registered and assigned to <strong>{formData.department}</strong> reviewers.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#059669', fontWeight: 700 }}>
                                <Loader2 className="animate-spin" size={18} />
                                Redirecting to dashboard...
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{editId ? 'Refine Audit' : 'Initiate Audit'}</h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>{editId ? 'Update details to address requested changes.' : 'Upload your expense or purchase details for real-time compliance checking.'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '3rem', alignItems: 'start' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2.5rem', border: '1.5px solid #f1f5f9' }}>
                        <div className="input-group">
                            <label className="input-label" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audit Title</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g., Q1 Hardware Procurement for IT"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                style={{ borderRadius: '12px', padding: '14px 18px', fontSize: '1rem' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label className="input-label" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction Date</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={formData.audit_date}
                                        onChange={(e) => setFormData({ ...formData, audit_date: e.target.value })}
                                        style={{ paddingLeft: '48px', borderRadius: '12px' }}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reviewing Department</label>
                                <div style={{ position: 'relative' }}>
                                    <Building2 size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <select
                                        className="input-field"
                                        style={{ paddingLeft: '48px', borderRadius: '12px' }}
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    >
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label className="input-label" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submission Category</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <select
                                        className="input-field"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        style={{ borderRadius: '12px' }}
                                    >
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>

                                    <AnimatePresence>
                                        {formData.category === 'other' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                            >
                                                <div style={{ position: 'relative' }}>
                                                    <Edit3 size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                                                    <input
                                                        type="text"
                                                        placeholder="Specify category..."
                                                        className="input-field"
                                                        style={{ paddingLeft: '44px', borderRadius: '12px', background: '#f0f9ff', border: '1.5px solid #bae6fd' }}
                                                        value={formData.customCategory}
                                                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount (RM)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input-field"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    style={{ borderRadius: '12px', textAlign: 'right', fontWeight: 700 }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description & Business Justification</label>
                            <textarea
                                className="input-field"
                                rows={4}
                                placeholder="Detail the business necessity. Include project IDs or specific client names if applicable..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{ borderRadius: '16px', padding: '16px', fontSize: '1rem', lineHeight: 1.6 }}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upload Attachments</label>
                            <div style={{ border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '2rem', textAlign: 'center', background: '#f8fafc', transition: 'all 0.2s', cursor: 'pointer' }}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <input type="file" id="file-upload" style={{ display: 'none' }} multiple onChange={handleFileChange} />
                                <Upload size={32} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', fontWeight: 600 }}>Click or drag files to upload</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>PDF, JPG, PNG or receipts (Max 10MB)</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1rem' }}>
                                {attachments.map((file, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'white', borderRadius: '10px', border: '1px solid #eef2f6' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FileText size={16} color="var(--primary)" />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{file.name}</span>
                                        </div>
                                        <button type="button" onClick={() => removeFile(i)} style={{ color: '#ef4444', background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ padding: '14px 40px', borderRadius: '14px', fontWeight: 700 }}>
                                Discard
                            </button>
                            <button type="submit" className="btn-primary" style={{ padding: '14px 40px', borderRadius: '14px', fontWeight: 700, fontSize: '1rem' }} disabled={loading}>
                                {loading ? <Loader2 size={24} className="animate-spin" /> : (editId ? 'Resubmit For Review' : 'Register Audit Request')}
                            </button>
                        </div>
                    </div>
                </form>

                <aside style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* AI Preview Card */}
                    <div className="glass-card" style={{ padding: '2rem', border: '1.5px solid #eff6ff', background: 'linear-gradient(to bottom, #ffffff, #f0f7ff)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                            <div style={{ background: '#2563eb', color: 'white', padding: '8px', borderRadius: '10px' }}>
                                <Sparkles size={20} />
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>Smart Checker</h3>
                        </div>
                        <AnimatePresence mode="wait">
                            {analyzing ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '2rem 1rem', background: 'white', borderRadius: '16px', border: '1px dashed #bfdbfe' }}>
                                    <Loader2 size={32} className="animate-spin" style={{ color: '#2563eb', margin: '0 auto 1rem' }} />
                                    <p style={{ fontSize: '0.95rem', color: '#1e3a8a', fontWeight: 600 }}>Analyzing compliance standards...</p>
                                </motion.div>
                            ) : aiFeedback ? (
                                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'baseline' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Completeness</span>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{aiFeedback.completeness_score}%</span>
                                        </div>
                                        <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', border: '1px solid #eef2f6' }}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${aiFeedback.completeness_score}%` }} style={{ height: '100%', background: aiFeedback.completeness_score > 80 ? '#10b981' : aiFeedback.completeness_score > 50 ? '#f59e0b' : '#ef4444' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {aiFeedback.summary?.map((item: string, i: number) => (
                                            <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#475569', background: 'white', padding: '10px 14px', borderRadius: '12px', border: '1px solid #f1f5f9', fontWeight: 500 }}>
                                                <div style={{ color: '#10b981', flexShrink: 0 }}><Check size={16} /></div>
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={handleAIAnalysis} style={{ width: '100%', marginTop: '1.5rem', padding: '12px', borderRadius: '12px', border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        Re-evaluate Request
                                    </button>
                                </motion.div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem 1.5rem', background: 'white', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
                                    <Sparkles size={32} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500, lineHeight: 1.5, marginBottom: '1.5rem' }}>Provide a detailed description to activate AI compliance checking.</p>
                                    <button type="button" onClick={handleAIAnalysis} disabled={!formData.title || !formData.description} className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, gap: '8px' }}>
                                        <Sparkles size={16} /> Analyze Compliance
                                    </button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </aside>
            </div>
        </div>
    );
}
