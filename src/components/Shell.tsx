import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, User, LogOut, Bell, Search, ShieldCheck, Archive, Users, Check, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Profile } from '../types';

export default function Shell({ session }: { session: any }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchProfile();
            fetchNotifications();

            // Realtime notifications
            const channel = supabase
                .channel('notifications-live')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
                    (payload) => {
                        setNotifications(prev => [payload.new, ...prev]);
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [session]);

    const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
    };

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(5);
        setNotifications(data || []);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const navItems = [
        { path: '/dashboard', label: 'Active Requests', icon: LayoutDashboard },
        { path: '/archive', label: 'Archive', icon: Archive },
        { path: '/create', label: 'New Request', icon: PlusCircle },
        { path: '/profile', label: 'Account Settings', icon: User },
    ];

    if (profile?.role === 'admin') {
        navItems.push({ path: '/admin/users', label: 'Manage Team', icon: Users });
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside style={{
                width: '280px',
                minWidth: '280px',
                background: '#0f172a',
                color: 'white',
                padding: '2.5rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3.5rem', paddingLeft: '8px' }}>
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                            <ShieldCheck size={28} />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', fontFamily: 'Outfit' }}>Audit Pack</h1>
                    </div>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            // Check for both exact path and query params versions for active state
                            const isActive = location.pathname === item.path || (item.path === '/create' && location.pathname === '/create');
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '14px 18px',
                                        borderRadius: '14px',
                                        background: isActive ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                                        color: isActive ? '#60a5fa' : 'rgba(255, 255, 255, 0.5)',
                                        fontWeight: isActive ? 600 : 500,
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: isActive ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid transparent'
                                    }}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '2rem' }}>
                    <div style={{
                        padding: '16px',
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #1e40af, #2563eb)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}>
                            <User size={22} color="white" />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {profile?.full_name || session?.user?.email?.split('@')[0]}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                {profile?.role} • {profile?.department}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1.5px solid rgba(239, 68, 68, 0.2)',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease-in-out'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <header style={{
                    height: '80px',
                    padding: '0 2.5rem',
                    background: 'white',
                    borderBottom: '1px solid #eef2f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <div style={{ position: 'relative', width: '380px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Find requests, people or audits..."
                            style={{
                                width: '100%',
                                padding: '12px 16px 12px 48px',
                                borderRadius: '14px',
                                border: '1.5px solid #f1f5f9',
                                background: '#f8fafc',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ position: 'relative', background: '#f8fafc', padding: '10px', borderRadius: '12px', color: '#64748b', border: '1px solid #f1f5f9', cursor: 'pointer' }}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', minWidth: '18px', height: '18px', background: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        style={{ position: 'absolute', top: '50px', right: 0, width: '320px', background: 'white', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #eef2f6', zIndex: 1000, overflow: 'hidden' }}
                                    >
                                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Notifications</h4>
                                            {unreadCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}>Mark all read</span>}
                                        </div>
                                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {notifications.length > 0 ? (
                                                notifications.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => {
                                                            markAsRead(n.id);
                                                            navigate(`/request/${n.request_id}`);
                                                            setShowNotifications(false);
                                                        }}
                                                        style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: n.is_read ? 'white' : 'rgba(37, 99, 235, 0.03)', transition: 'background 0.2s' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = n.is_read ? 'white' : 'rgba(37, 99, 235, 0.03)'}
                                                    >
                                                        <div style={{ display: 'flex', gap: '12px' }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? 'transparent' : '#2563eb', marginTop: '6px', flexShrink: 0 }} />
                                                            <div>
                                                                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{n.title}</p>
                                                                <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>{n.message}</p>
                                                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Clock size={10} /> Just now
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                                                    <Bell size={32} style={{ marginBottom: '12px', opacity: 0.2 }} />
                                                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No new notifications</p>
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            onClick={() => navigate('/notifications')}
                                            style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', background: 'white' }}
                                        >
                                            View All
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <Outlet />
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
