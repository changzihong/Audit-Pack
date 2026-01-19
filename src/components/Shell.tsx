import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, User, LogOut, Bell, ShieldCheck, Archive, Users, Check, Clock, FileText, Menu, X } from 'lucide-react';
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (profile) {
            // Strict Department Check: If not Admin and no Department, FORCE to profile
            if (profile.role !== 'admin' && !profile.department && location.pathname !== '/profile') {
                navigate('/profile', { replace: true });
            }
        }
    }, [profile, location.pathname, navigate]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchProfile();
            fetchNotifications();

            // Realtime notifications
            const channel = supabase
                .channel('notifications-live')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
                    () => {
                        fetchNotifications();
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [session]);

    useEffect(() => {
        // Manual trigger for cross-component updates
        const handler = () => fetchNotifications();
        window.addEventListener('notifications:updated', handler);
        return () => window.removeEventListener('notifications:updated', handler);
    }, [session]);

    // Close mobile menu on navigation
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const [companyName, setCompanyName] = useState<string>('');

    const fetchProfile = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*, organizations(name)')
            .eq('id', session.user.id)
            .single();

        setProfile(data);
        // @ts-ignore
        if (data?.organizations?.name) {
            // @ts-ignore
            setCompanyName(data.organizations.name);
        }
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

    if (profile?.status === 'suspended') {
        return (
            <div style={{
                height: '100vh',
                width: '100vw',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.4,
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)'
                }} />

                <div className="glass-card" style={{
                    position: 'relative',
                    padding: '3rem',
                    maxWidth: '480px',
                    width: '90%',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{
                        width: '80px', height: '80px', margin: '0 auto 1.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 40px rgba(239, 68, 68, 0.2)'
                    }}>
                        <ShieldCheck size={40} color="#ef4444" />
                    </div>

                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                        Account Suspended
                    </h1>

                    <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                        Your access to <strong>Audit Pack</strong> has been temporarily suspended by your organization's administrator.
                    </p>

                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>
                            Please contact your manager or IT support to restore your access.
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: '1rem',
                            background: 'white',
                            color: '#0f172a',
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        <LogOut size={20} /> Back to Login
                    </button>
                </div>
            </div>
        );
    }

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        setShowNotifications(false);
        navigate('/requests'); // Take user to inbox to see the update
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/requests', label: 'Request Center', icon: FileText },
    ];


    navItems.push({ path: '/archive', label: 'Archive', icon: Archive });
    navItems.push({ path: '/profile', label: 'Account Settings', icon: User });



    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc', overflow: 'hidden', flexDirection: 'column' }}>

            {/* Mobile Header */}
            <header className="mobile-flex-show" style={{
                height: '64px',
                background: '#0f172a',
                color: 'white',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.25rem',
                zIndex: 100,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={24} color="var(--primary)" />
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: 'Outfit' }}>Audit Pack</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{ background: 'none', color: 'white', padding: '8px', display: 'flex' }}
                >
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

                {/* Sidebar (Desktop) / Mobile Drawer */}
                <aside style={{
                    width: '280px',
                    minWidth: '280px',
                    background: '#0f172a',
                    color: 'white',
                    padding: '2.5rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    zIndex: 90,
                    transition: 'transform 0.3s ease',
                    position: window.innerWidth <= 768 ? 'absolute' : 'relative',
                    transform: window.innerWidth <= 768 && !mobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
                    boxShadow: mobileMenuOpen ? '10px 0 30px rgba(0,0,0,0.3)' : 'none'
                }} className={mobileMenuOpen ? 'mobile-show' : 'mobile-hide'}>
                    <div style={{ flex: 1 }}>
                        <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3.5rem', paddingLeft: '8px' }}>
                            <div style={{ background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', fontFamily: 'Outfit' }}>Audit Pack</h1>
                                {companyName && (
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{companyName}</p>
                                )}
                            </div>
                        </div>

                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            padding: '14px 18px',
                                            borderRadius: '16px',
                                            color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                                            background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                            fontWeight: 600,
                                            fontSize: '0.95rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Icon size={20} style={{ color: isActive ? 'var(--primary-light)' : 'inherit' }} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Sidebar Footer */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2rem', marginTop: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={20} color="var(--primary-light)" />
                            </div>
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{profile?.full_name}</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 800 }}>{profile?.role}</p>
                                {profile?.department && (
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{profile.department}</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px',
                                borderRadius: '16px',
                                color: '#f87171',
                                background: 'rgba(239, 68, 68, 0.05)',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                border: '1px solid rgba(239, 68, 68, 0.1)'
                            }}
                        >
                            <LogOut size={20} /> Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    {/* Header (Desktop) */}
                    <header className="mobile-hide" style={{
                        height: '100px',
                        minHeight: '100px',
                        padding: '0 3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        background: 'transparent',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    style={{
                                        background: 'white',
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64748b',
                                        boxShadow: 'var(--shadow-sm)',
                                        border: '1px solid var(--border)',
                                        position: 'relative'
                                    }}
                                >
                                    <Bell size={22} />
                                    {unreadCount > 0 && (
                                        <span style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            style={{
                                                position: 'absolute',
                                                top: '60px',
                                                right: 0,
                                                width: '320px',
                                                background: 'white',
                                                borderRadius: '24px',
                                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                                                border: '1px solid var(--border)',
                                                zIndex: 100,
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 800 }}>Notifications</div>
                                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                {notifications.length > 0 ? (
                                                    notifications.map((n) => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => markAsRead(n.id)}
                                                            className="notification-item"
                                                            style={{
                                                                padding: '1rem',
                                                                borderBottom: '1px solid #f8fafc',
                                                                background: n.is_read ? 'white' : '#eff6ff',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.2s',
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            {!n.is_read && <div style={{ position: 'absolute', left: '0', top: '0', bottom: '0', width: '4px', background: 'var(--primary)' }} />}
                                                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: n.is_read ? 600 : 700, color: '#0f172a' }}>{n.title}</p>
                                                            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>{n.content}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>No new notifications</div>
                                                )}
                                            </div>
                                            <div
                                                onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                                                style={{
                                                    padding: '1rem',
                                                    textAlign: 'center',
                                                    borderTop: '1px solid #f1f5f9',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    color: '#2563eb',
                                                    transition: 'background 0.2s'
                                                }}
                                                className="hover:bg-slate-50"
                                            >
                                                View All Notifications
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 6px 6px 16px', background: 'white', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>{profile?.full_name}</p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{profile?.role}</p>
                                </div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                                    {profile?.full_name?.charAt(0)}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div style={{ flex: 1, padding: '0 3rem 3rem 3rem' }} className="mobile-p-sm">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Overlay for mobile menu */}
            {mobileMenuOpen && (
                <div
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 80
                    }}
                />
            )}

            <style>{`
                aside {
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @media (max-width: 768px) {
                    aside {
                        position: fixed !important;
                        top: 64px !important;
                        left: 0 !important;
                        bottom: 0 !important;
                        height: calc(100vh - 64px) !important;
                        transform: \${mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
                        display: flex !important;
                    }
                }
                .notification-item:hover {
                    background: #f8fafc !important;
                }
            `}</style>
        </div>
    );
}
