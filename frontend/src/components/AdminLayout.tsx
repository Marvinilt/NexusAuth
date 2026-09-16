import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Building2, 
    BarChart3, 
    ScrollText, 
    User, 
    LogOut, 
    ShieldCheck, 
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Si el usuario no es superadmin, restringir el acceso a los módulos administrativos
    if (!user?.isSuperAdmin) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80vh',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '2.5rem',
                    borderRadius: '16px',
                    maxWidth: '480px'
                }}>
                    <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Acceso Restringido</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                        Esta sección está reservada exclusivamente para el Super Administrador del sistema.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Volver a Mi Perfil
                    </button>
                </div>
            </div>
        );
    }

    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('nexus_admin_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            try {
                localStorage.setItem('nexus_admin_sidebar_collapsed', String(next));
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    };

    const navItems = [
        { path: '/admin/clients', label: 'Clientes', icon: Building2, description: 'Gestión y credenciales' },
        { path: '/admin/statistics', label: 'Estadísticas', icon: BarChart3, description: 'Métricas por sistema' },
        { path: '/admin/logs', label: 'Logs de Auditoría', icon: ScrollText, description: 'Registro de accesos' },
        { path: '/dashboard', label: 'Mi Perfil (2FA)', icon: User, description: 'Configuración personal' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)', background: 'var(--bg-dark)' }}>
            {/* Sidebar Navigation */}
            <aside style={{
                width: isCollapsed ? '72px' : '260px',
                background: 'rgba(15, 23, 42, 0.95)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: isCollapsed ? '1.25rem 0.5rem' : '1.5rem 1rem',
                flexShrink: 0,
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s ease'
            }}>
                <div>
                    {/* Header Admin Badge & Collapse Toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'space-between',
                        gap: '0.5rem',
                        marginBottom: '1.5rem'
                    }}>
                        {!isCollapsed && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                padding: '0.6rem 0.75rem',
                                background: 'rgba(99, 102, 241, 0.08)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '12px',
                                flex: 1,
                                overflow: 'hidden'
                            }}>
                                <ShieldCheck size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                        Consola Admin
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                                        Super Admin
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={toggleSidebar}
                            title={isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
                            aria-label={isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
                            style={{
                                width: isCollapsed ? '42px' : '32px',
                                height: isCollapsed ? '42px' : '32px',
                                borderRadius: '10px',
                                background: isCollapsed ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                                border: isCollapsed ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border)',
                                color: isCollapsed ? 'var(--primary)' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={16} />}
                        </button>
                    </div>

                    {/* Navigation Menu */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    title={isCollapsed ? item.label : undefined}
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                                        gap: isCollapsed ? 0 : '0.75rem',
                                        padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                                        borderRadius: '10px',
                                        textDecoration: 'none',
                                        color: isActive ? '#fff' : 'var(--text-secondary)',
                                        background: isActive ? 'var(--primary)' : 'transparent',
                                        boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                                        fontWeight: isActive ? 600 : 500,
                                        fontSize: '0.9rem',
                                        transition: 'all 0.15s ease'
                                    })}
                                >
                                    <Icon size={19} style={{ flexShrink: 0 }} />
                                    {!isCollapsed && (
                                        <span style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {item.label}
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer User Info & Logout */}
                <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    alignItems: isCollapsed ? 'center' : 'stretch'
                }}>
                    <div 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            gap: '0.75rem' 
                        }} 
                        title={isCollapsed ? `${user?.email} (En línea)` : undefined}
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), #ec4899)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: '#fff',
                            flexShrink: 0
                        }}>
                            {user?.email[0]?.toUpperCase()}
                        </div>
                        {!isCollapsed && (
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {user?.email}
                                </div>
                                <span style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--success)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}>
                                    ● En línea
                                </span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        title="Cerrar Sesión"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: isCollapsed ? 0 : '0.5rem',
                            padding: isCollapsed ? '0.55rem 0' : '0.55rem',
                            width: isCollapsed ? '38px' : '100%',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            alignSelf: 'center'
                        }}
                    >
                        <LogOut size={15} style={{ flexShrink: 0 }} />
                        {!isCollapsed && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                minWidth: 0,
                padding: '1.5rem 1.75rem',
                overflowY: 'auto',
                maxWidth: '1400px'
            }}>
                {children}
            </main>
        </div>
    );
};
