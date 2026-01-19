import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users, Search, Shield, Building2, User,
    Settings2, Check, X, Loader2, AlertCircle, Ban, Power
} from 'lucide-react';
import { Profile } from '../types';

export default function ManageUsers() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [departments, setDepartments] = useState<string[]>([]);

    // Edit form state
    const [editForm, setEditForm] = useState<{ role: string, department: string }>({ role: '', department: '' });
    const [saving, setSaving] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

    const roles = ['employee', 'manager'];

    useEffect(() => {
        fetchCurrentUser();
        fetchData();
    }, []);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchDepartments()]);
        setLoading(false);
    };

    const fetchDepartments = async () => {
        const { data } = await supabase.from('departments').select('name').order('name');
        if (data && data.length > 0) {
            setDepartments(data.map(d => d.name).filter(name => name !== 'General'));
        } else {
            // Fallback if no db departments
            setDepartments(['Engineering', 'Finance & Accounting', 'Human Resources', 'Operations', 'Sales & Marketing', 'IT Support']);
        }
    };

    const fetchUsers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (data) setUsers(data);
    };

    const startEdit = (user: Profile) => {
        // Prevent editing self
        if (user.id === currentUserId) return;

        setEditingId(user.id);
        setEditForm({ role: user.role, department: user.department || 'General' });
    };

    const toggleStatus = async (user: Profile) => {
        // Prevent suspending self
        if (user.id === currentUserId) return;

        setTogglingStatus(user.id);
        const newStatus = user.status === 'suspended' ? 'active' : 'suspended';

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', user.id);

            if (error) throw error;

            // Optimistic update
            setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus as any } : u));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update user status.');
        } finally {
            setTogglingStatus(null);
        }
    };

    const saveChanges = async (userId: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    role: editForm.role as any,
                    department: editForm.department
                })
                .eq('id', userId);

            if (error) throw error;
            setEditingId(null);
            fetchUsers();
        } catch (err) {
            console.error('Error updating user:', err);
            alert('Failed to update user.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader-ring"></div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#1e293b', color: 'white', padding: '10px', borderRadius: '12px' }}>
                        <Users size={24} />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }} className="mobile-h1">Team Management</h1>
                </div>
                <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }} className="mobile-hide">
                    Manage roles, departmental assignments, and account access.
                </p>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1.5px solid #f1f5f9', borderRadius: '24px' }}>
                <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="mobile-stack mobile-gap-4 mobile-p-md">
                    <div style={{ position: 'relative', width: '320px' }} className="mobile-full">
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" placeholder="Search team members..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Member</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Role</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Department</th>
                                <th style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s', background: user.status === 'suspended' ? '#fff1f2' : 'white' }} className="hover:bg-slate-50">
                                    <td style={{ padding: '1.5rem 2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 700, position: 'relative' }}>
                                                {user.full_name?.charAt(0) || 'U'}
                                                {user.status === 'suspended' && (
                                                    <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#ef4444', border: '2px solid white', borderRadius: '50%', width: 14, height: 14 }}></div>
                                                )}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, color: user.status === 'suspended' ? '#991b1b' : '#0f172a', margin: '0 0 2px 0', fontSize: '1rem' }}>{user.full_name}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, fontWeight: 500 }}>{user.id.slice(0, 18)}... {user.id === currentUserId && '(You)'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem 2rem' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                                            background: user.status === 'suspended' ? '#fecaca' : '#dcfce7',
                                            color: user.status === 'suspended' ? '#991b1b' : '#166534',
                                            display: 'inline-flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            {user.status === 'suspended' ? <Ban size={12} /> : <Check size={12} />}
                                            {user.status === 'suspended' ? 'Suspended' : 'Active'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.5rem 2rem' }}>
                                        {editingId === user.id ? (
                                            <select
                                                value={editForm.role}
                                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '120px' }}
                                            >
                                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: user.role === 'admin' ? '#1e293b10' : user.role === 'manager' ? '#2563eb10' : '#f1f5f9',
                                                color: user.role === 'admin' ? '#1e293b' : user.role === 'manager' ? '#2563eb' : '#64748b',
                                                padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase'
                                            }}>
                                                <Shield size={12} /> {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.5rem 2rem' }}>
                                        {editingId === user.id ? (
                                            <select
                                                value={editForm.department}
                                                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '180px' }}
                                            >
                                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        ) : (
                                            <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Building2 size={16} color="#94a3b8" /> {user.department || 'N/A'}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.5rem 2rem' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {editingId === user.id ? (
                                                <>
                                                    <button onClick={() => saveChanges(user.id)} style={{ padding: '8px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none' }} disabled={saving}>
                                                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} style={{ padding: '8px', background: '#f1f5f9', color: '#64748b', borderRadius: '8px', border: 'none' }}>
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {user.id !== currentUserId && (
                                                        <>
                                                            <button
                                                                onClick={() => startEdit(user)}
                                                                style={{ padding: '8px', borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0', color: '#475569', cursor: 'pointer' }}
                                                                title="Edit Access"
                                                            >
                                                                <Settings2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleStatus(user)}
                                                                disabled={togglingStatus === user.id}
                                                                style={{
                                                                    padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                                                    background: user.status === 'suspended' ? '#dcfce7' : '#fee2e2',
                                                                    color: user.status === 'suspended' ? '#166534' : '#991b1b'
                                                                }}
                                                                title={user.status === 'suspended' ? "Activate Account" : "Suspend Account"}
                                                            >
                                                                {togglingStatus === user.id ? <Loader2 className="animate-spin" size={16} /> : <Power size={16} />}
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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
