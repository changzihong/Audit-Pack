import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Trash2, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            setNotifications(data || []);
        }
        setLoading(false);
    };

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id);

        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    };

    const clearAll = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('notifications').delete().eq('user_id', user.id);
        setNotifications([]);
        setShowClearConfirm(false);
        window.dispatchEvent(new Event('notifications:updated'));
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await supabase.from('notifications').delete().eq('id', id);
        setNotifications(notifications.filter(n => n.id !== id));
        window.dispatchEvent(new Event('notifications:updated'));
    };

    const handleNotificationClick = async (n: any) => {
        if (!n.is_read) {
            await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
        }
        setNotifications(notifications.map(item => item.id === n.id ? { ...item, is_read: true } : item));

        if (n.resource_id) {
            navigate(`/request/${n.resource_id}`);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader-ring"></div>
        </div>
    );

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '12px' }}>
                        <Bell size={24} color="#0f172a" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Notifications</h1>
                        <p style={{ color: '#64748b', margin: 0 }}>Stay updated with your audit requests.</p>
                    </div>
                </div>

                {notifications.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={markAllAsRead}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 16px', borderRadius: '10px',
                                background: 'white', border: '1px solid #e2e8f0',
                                color: '#475569', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            className="hover:bg-slate-50"
                        >
                            <CheckCircle2 size={16} /> Mark all read
                        </button>
                        <button
                            onClick={() => setShowClearConfirm(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 16px', borderRadius: '10px',
                                background: '#fee2e2', border: '1px solid #fecaca',
                                color: '#991b1b', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            className="hover:opacity-80"
                        >
                            <Trash2 size={16} /> Clear all
                        </button>
                    </div>
                )}
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #f1f5f9', borderRadius: '16px' }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <Bell size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>No notifications</h3>
                        <p style={{ color: '#94a3b8' }}>You are all caught up! Check back later.</p>
                    </div>
                ) : (
                    <div>
                        <AnimatePresence>
                            {notifications.map((n) => (
                                <motion.div
                                    key={n.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                    onClick={() => handleNotificationClick(n)}
                                    style={{
                                        padding: '1.5rem',
                                        borderBottom: '1px solid #f1f5f9',
                                        background: n.is_read ? 'white' : '#f8fafc',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                    className="hover:bg-slate-50 group"
                                >
                                    <div style={{ display: 'flex', gap: '16px', paddingRight: '40px' }}>
                                        <div style={{
                                            width: '10px', height: '10px', borderRadius: '50%',
                                            background: n.is_read ? 'transparent' : '#2563eb',
                                            marginTop: '6px', flexShrink: 0
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <p style={{
                                                margin: '0 0 6px 0',
                                                color: '#0f172a',
                                                fontWeight: n.is_read ? 500 : 700,
                                                fontSize: '1rem'
                                            }}>
                                                {n.title}
                                            </p>
                                            <p style={{
                                                margin: '0 0 8px 0',
                                                color: '#475569',
                                                fontSize: '0.9rem'
                                            }}>
                                                {n.content}
                                            </p>
                                            <p style={{
                                                margin: 0,
                                                color: '#94a3b8',
                                                fontSize: '0.8rem',
                                                display: 'flex', alignItems: 'center', gap: '6px'
                                            }}>
                                                <Clock size={12} />
                                                {new Date(n.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Delete Individual Button - Absolute positioned */}
                                    <button
                                        onClick={(e) => deleteNotification(n.id, e)}
                                        style={{
                                            position: 'absolute',
                                            top: '1.5rem',
                                            right: '1.5rem',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'transparent',
                                            color: '#cbd5e1',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        className="hover:bg-red-50 hover:text-red-500"
                                        title="Delete notification"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Clear All Confirmation Modal */}
            <AnimatePresence>
                {showClearConfirm && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowClearConfirm(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="glass-card"
                            style={{
                                width: '90%', maxWidth: '400px', padding: '2rem',
                                position: 'relative', background: 'white', borderRadius: '24px',
                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '20px',
                                background: '#fee2e2', color: '#dc2626',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
                            }}>
                                <AlertTriangle size={32} />
                            </div>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Clear All Notifications?</h2>
                            <p style={{ color: '#64748b', lineHeight: 1.5, marginBottom: '2rem' }}>
                                This will permanently remove all notifications from your history. This action cannot be undone.
                            </p>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setShowClearConfirm(false)}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '12px',
                                        border: '1px solid #e2e8f0', background: 'white',
                                        color: '#64748b', fontWeight: 700, cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={clearAll}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '12px',
                                        border: 'none', background: '#dc2626',
                                        color: 'white', fontWeight: 700, cursor: 'pointer',
                                        boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)'
                                    }}
                                >
                                    Yes, Clear All
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
              .loader-ring {
                width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb;
                border-radius: 50%; animation: spin 1s linear infinite;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              .hover\\:bg-slate-50:hover { background-color: #f8fafc !important; }
              .hover\\:bg-red-50:hover { background-color: #fef2f2 !important; }
              .hover\\:text-red-500:hover { color: #ef4444 !important; }
              .hover\\:opacity-80:hover { opacity: 0.8; }
            `}</style>
        </div>
    );
}
