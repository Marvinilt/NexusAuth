import React, { useState, useEffect } from 'react';
import { api, ApiError } from '../../api';
import {
    Users,
    Building2,
    Search,
    ShieldCheck,
    ShieldAlert,
    RefreshCcw,
    RotateCcw,
    Calendar,
    Clock,
    Mail,
    Lock,
    AlertTriangle,
    X,
    CheckCircle2
} from 'lucide-react';

/**
 * Representa un sistema cliente registrado en la plataforma.
 */
interface Client {
    id: string;
    name: string;
}

/**
 * Representa un usuario auditado en el directorio administrativo.
 */
interface AdminUser {
    id: string;
    email: string;
    clientId: string | null;
    clientName: string;
    mfaEnabled: boolean;
    createdAt: string;
    updatedAt: string;
    passwordChangedAt: string | null;
    lastLoginAt: string | null;
    oauthProviders: string[];
    hasPassword: boolean;
}

/**
 * Pantalla de gestión y directorio de usuarios del sistema administrativo multicliente.
 * Permite filtrar por sistema cliente, buscar por correo, inspeccionar metadatos y reiniciar MFA.
 */
export default function UsersPage(): React.ReactElement {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('all');
    const [searchEmail, setSearchEmail] = useState<string>('');
    const [limit, setLimit] = useState<number>(50);

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estado del diálogo de confirmación para reseteo de MFA
    const [userToResetMfa, setUserToResetMfa] = useState<AdminUser | null>(null);
    const [resettingMfa, setResettingMfa] = useState<boolean>(false);

    // Cargar clientes para el selector desplegable
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await api.get('/clients');
                setClients(data);
            } catch {
                // Manejo silencioso si falla la consulta inicial de clientes
            }
        };
        fetchClients();
    }, []);

    // Consulta de usuarios filtrados
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            let query = `/admin/users?limit=${limit}`;
            if (selectedClient && selectedClient !== 'all') {
                query += `&clientId=${selectedClient}`;
            }
            if (searchEmail.trim()) {
                query += `&email=${encodeURIComponent(searchEmail.trim())}`;
            }

            const data = await api.get(query);
            setUsers(data);
        } catch (err: unknown) {
            const msg = err instanceof ApiError ? err.message : 'Error al cargar el directorio de usuarios';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Efecto debounce para búsquedas
    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(debounce);
    }, [selectedClient, searchEmail, limit]);

    // Ejecutar el reseteo de MFA para el usuario seleccionado
    const handleConfirmResetMfa = async () => {
        if (!userToResetMfa) return;

        try {
            setResettingMfa(true);
            setError(null);

            const response = await api.post(`/admin/users/${userToResetMfa.id}/reset-mfa`);

            setSuccessMessage(response.message || `Factor de doble autenticación reiniciado para ${userToResetMfa.email}`);

            // Actualizar localmente el usuario para feedback inmediato
            setUsers(prevUsers =>
                prevUsers.map(u =>
                    u.id === userToResetMfa.id
                        ? { ...u, mfaEnabled: false }
                        : u
                )
            );

            setUserToResetMfa(null);

            // Auto-ocultar notificación de éxito tras 5 segundos
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        } catch (err: unknown) {
            const msg = err instanceof ApiError ? err.message : 'No se pudo reiniciar el factor de doble autenticación';
            setError(msg);
        } finally {
            setResettingMfa(false);
        }
    };

    return (
        <div>
            {/* Encabezado Principal */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
                        Gestión de <span style={{ color: 'var(--primary)' }}>Usuarios Multicliente</span>
                    </h1>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Directorio centralizado de cuentas, estados de autenticación MFA y reseteo de accesos por sistema cliente.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchUsers}
                    aria-label="Refrescar listado de usuarios"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 1.25rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                    <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                    Refrescar
                </button>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div style={{
                background: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.25rem',
                alignItems: 'center'
            }}>
                {/* 1. Filtro Principal por Sistema Cliente */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={16} color="var(--primary)" />
                    <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        aria-label="Filtrar por sistema cliente"
                        style={{
                            background: 'var(--bg-dark)',
                            color: '#fff',
                            border: '1px solid var(--border)',
                            padding: '0.5rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Todos los Clientes</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* 2. Buscador por Correo Electrónico */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.75rem',
                    flex: '1',
                    minWidth: '240px'
                }}>
                    <Search size={15} color="var(--text-secondary)" />
                    <input
                        type="text"
                        placeholder="Buscar por correo electrónico..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        aria-label="Buscar usuario por correo"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontSize: '0.85rem',
                            width: '100%'
                        }}
                    />
                    {searchEmail && (
                        <button
                            type="button"
                            onClick={() => setSearchEmail('')}
                            aria-label="Limpiar búsqueda"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* 3. Límite de Registros */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Límite:</span>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        aria-label="Límite de visualización"
                        style={{
                            background: 'var(--bg-dark)',
                            color: '#fff',
                            border: '1px solid var(--border)',
                            padding: '0.5rem 0.6rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value={50}>50 usuarios</option>
                        <option value={100}>100 usuarios</option>
                        <option value={200}>200 usuarios</option>
                    </select>
                </div>
            </div>

            {/* Notificaciones de Éxito o Error */}
            {successMessage && (
                <div style={{
                    padding: '1rem 1.25rem',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '10px',
                    color: '#86efac',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={18} color="var(--success)" />
                        <span>{successMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSuccessMessage(null)}
                        style={{ background: 'transparent', border: 'none', color: '#86efac', cursor: 'pointer' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {error && (
                <div style={{
                    padding: '1rem 1.25rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--error)',
                    borderRadius: '10px',
                    color: '#fca5a5',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem'
                }}>
                    <AlertTriangle size={18} color="var(--error)" />
                    <span>{error}</span>
                </div>
            )}

            {/* Tabla de Usuarios */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    Cargando directorio de usuarios...
                </div>
            ) : users.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '16px',
                    border: '1px dashed var(--border)'
                }}>
                    <Users size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No se encontraron usuarios</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                        No hay usuarios registrados que coincidan con los filtros seleccionados.
                    </p>
                </div>
            ) : (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    overflowX: 'auto',
                    maxWidth: '100%'
                }}>
                    <table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{
                                borderBottom: '1px solid var(--border)',
                                background: 'rgba(15, 23, 42, 0.6)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <th style={{ padding: '1rem 1.5rem' }}>Usuario (Email)</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Sistema Cliente</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Tipo de Registro</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Estado MFA (2FA)</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Fechas de Actividad</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    style={{
                                        borderBottom: '1px solid var(--border)',
                                        fontSize: '0.875rem',
                                        transition: 'background 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Usuario y Email */}
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Mail size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                                            <span>{user.email}</span>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                            ID: {user.id.substring(0, 8)}...
                                        </div>
                                    </td>

                                    {/* Sistema Cliente */}
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '6px',
                                            color: '#a5b4fc',
                                            fontSize: '0.8rem',
                                            fontWeight: 500
                                        }}>
                                            <Building2 size={13} />
                                            <span>{user.clientName}</span>
                                        </div>
                                    </td>

                                    {/* Tipo de Registro */}
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                            {user.hasPassword && (
                                                <span
                                                    title="Autenticación local con contraseña"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        background: 'rgba(148, 163, 184, 0.1)',
                                                        border: '1px solid rgba(148, 163, 184, 0.2)',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        color: '#cbd5e1'
                                                    }}
                                                >
                                                    <Lock size={11} />
                                                    Contraseña
                                                </span>
                                            )}
                                            {user.oauthProviders.map((provider) => (
                                                <span
                                                    key={provider}
                                                    title={`Vinculado mediante OAuth (${provider})`}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        background: 'rgba(56, 189, 248, 0.1)',
                                                        border: '1px solid rgba(56, 189, 248, 0.2)',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        color: '#7dd3fc',
                                                        textTransform: 'capitalize'
                                                    }}
                                                >
                                                    {provider.toLowerCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Estado MFA */}
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {user.mfaEnabled ? (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.25rem 0.65rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: 'rgba(34, 197, 94, 0.15)',
                                                color: 'var(--success)',
                                                border: '1px solid rgba(34, 197, 94, 0.3)'
                                            }}>
                                                <ShieldCheck size={13} />
                                                MFA Activo
                                            </span>
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.25rem 0.65rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: 'rgba(148, 163, 184, 0.08)',
                                                color: 'var(--text-secondary)',
                                                border: '1px solid rgba(148, 163, 184, 0.2)'
                                            }}>
                                                <ShieldAlert size={13} />
                                                Inactivo
                                            </span>
                                        )}
                                    </td>

                                    {/* Fechas de Actividad */}
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '3px' }}>
                                            <Calendar size={12} color="var(--primary)" />
                                            <span>Alta: {new Date(user.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Clock size={12} />
                                            <span>
                                                {user.lastLoginAt
                                                    ? `Último acceso: ${new Date(user.lastLoginAt).toLocaleDateString()}`
                                                    : 'Sin inicios registrados'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Columna de Acciones (Reinicio de MFA) */}
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                        {user.mfaEnabled ? (
                                            <button
                                                type="button"
                                                onClick={() => setUserToResetMfa(user)}
                                                title={`Reiniciar factor de doble autenticación para ${user.email}`}
                                                aria-label={`Reiniciar MFA de ${user.email}`}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    padding: '0.4rem 0.75rem',
                                                    background: 'rgba(245, 158, 11, 0.12)',
                                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                                    color: '#fbbf24',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.25)';
                                                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.6)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)';
                                                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                                                }}
                                            >
                                                <RotateCcw size={13} />
                                                Reiniciar MFA
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                                                Sin 2FA
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Accesible de Confirmación de Reinicio de MFA */}
            {userToResetMfa && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reset-mfa-title"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(10, 15, 29, 0.82)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(6px)',
                        padding: '1.5rem'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !resettingMfa) {
                            setUserToResetMfa(null);
                        }
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            background: 'var(--card-bg)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                            animation: 'fadeIn 0.2s ease-out'
                        }}
                    >
                        {/* Cabecera del Diálogo */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border)',
                            background: 'rgba(245, 158, 11, 0.08)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <RotateCcw size={18} color="#fbbf24" />
                                </div>
                                <h3 id="reset-mfa-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Reiniciar Factor de Doble Autenticación
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => !resettingMfa && setUserToResetMfa(null)}
                                aria-label="Cerrar diálogo"
                                disabled={resettingMfa}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: resettingMfa ? 'not-allowed' : 'pointer',
                                    padding: '0.4rem',
                                    borderRadius: '6px'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Cuerpo del Diálogo */}
                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '0.925rem', lineHeight: '1.5' }}>
                                ¿Estás seguro de que deseas restablecer el factor MFA para el usuario <strong>{userToResetMfa.email}</strong>?
                            </p>
                            <div style={{
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                borderRadius: '10px',
                                padding: '0.85rem 1rem',
                                color: '#fcd34d',
                                fontSize: '0.825rem',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.5rem'
                            }}>
                                <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    Esta acción eliminará el secreto TOTP actual y desactivará el 2FA. El usuario podrá iniciar sesión únicamente con su contraseña y registrar un nuevo dispositivo si lo requiere.
                                </div>
                            </div>
                        </div>

                        {/* Pie con Botones de Confirmación */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            padding: '1rem 1.5rem',
                            background: 'rgba(15, 23, 42, 0.5)',
                            borderTop: '1px solid var(--border)'
                        }}>
                            <button
                                type="button"
                                onClick={() => setUserToResetMfa(null)}
                                disabled={resettingMfa}
                                style={{
                                    padding: '0.6rem 1.1rem',
                                    background: 'transparent',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-secondary)',
                                    borderRadius: '8px',
                                    cursor: resettingMfa ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 600
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmResetMfa}
                                disabled={resettingMfa}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.6rem 1.25rem',
                                    background: '#d97706',
                                    border: 'none',
                                    color: '#ffffff',
                                    borderRadius: '8px',
                                    cursor: resettingMfa ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                                }}
                            >
                                <RotateCcw size={14} className={resettingMfa ? 'animate-spin' : ''} />
                                {resettingMfa ? 'Reiniciando...' : 'Confirmar Reinicio'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
