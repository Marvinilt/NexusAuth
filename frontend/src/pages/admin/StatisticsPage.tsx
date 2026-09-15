import { useState, useEffect } from 'react';
import { api, ApiError } from '../../api';
import { 
    BarChart3, 
    Users, 
    KeyRound, 
    ShieldCheck, 
    CheckCircle2, 
    XCircle, 
    Calendar, 
    Building2,
    Mail,
    Share2,
    RefreshCcw,
    TrendingUp
} from 'lucide-react';

interface Client {
    id: string;
    name: string;
}

interface StatsData {
    summary: {
        totalUsers: number;
        newUsersInRange: number;
        passwordChanges: number;
        mfaEnabledUsers: number;
        successfulLogins: number;
        failedLogins: number;
    };
    registrationTypes: {
        email: number;
        social: number;
    };
    dateRange: {
        from: string | null;
        to: string;
    };
}

export default function StatisticsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('all');
    const [range, setRange] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch client list for dropdown
    useEffect(() => {
        const fetchClientsList = async () => {
            try {
                const data = await api.get('/clients');
                setClients(data);
            } catch {
                // Silently handle if error
            }
        };
        fetchClientsList();
    }, []);

    // Fetch stats on filter change
    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            let query = `/admin/stats?clientId=${selectedClient}&range=${range}`;
            if (range === 'custom') {
                if (customFrom) query += `&from=${customFrom}`;
                if (customTo) query += `&to=${customTo}`;
            }

            const data = await api.get(query);
            setStats(data);
        } catch (err: unknown) {
            const msg = err instanceof ApiError ? err.message : 'Error al cargar estadísticas';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [selectedClient, range, customFrom, customTo]);

    const totalReg = (stats?.registrationTypes.email || 0) + (stats?.registrationTypes.social || 0);
    const emailPercent = totalReg > 0 ? Math.round(((stats?.registrationTypes.email || 0) / totalReg) * 100) : 0;
    const socialPercent = totalReg > 0 ? Math.round(((stats?.registrationTypes.social || 0) / totalReg) * 100) : 0;

    const totalLogins = (stats?.summary.successfulLogins || 0) + (stats?.summary.failedLogins || 0);
    const successLoginRate = totalLogins > 0 
        ? Math.round(((stats?.summary.successfulLogins || 0) / totalLogins) * 100) 
        : 100;

    const mfaRate = (stats?.summary.totalUsers || 0) > 0 
        ? Math.round(((stats?.summary.mfaEnabledUsers || 0) / stats!.summary.totalUsers) * 100)
        : 0;

    return (
        <div>
            {/* Header */}
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
                        Panel de <span style={{ color: 'var(--primary)' }}>Estadísticas</span>
                    </h1>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Métricas de adopción, registros y seguridad por sistema cliente y periodo de tiempo.
                    </p>
                </div>

                {/* Refresh button */}
                <button
                    onClick={fetchStats}
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
                        fontWeight: 600
                    }}
                >
                    <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </div>

            {/* Filter Controls Toolbar */}
            <div style={{
                background: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.5rem',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {/* Client Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Building2 size={18} color="var(--primary)" />
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Sistema Cliente:
                    </label>
                    <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        style={{
                            background: 'var(--bg-dark)',
                            color: '#fff',
                            border: '1px solid var(--border)',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Todos los sistemas clientes</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Date Range Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Calendar size={16} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Rango:
                    </span>

                    {(['today', '7d', '30d', 'custom'] as const).map((r) => {
                        const labels: Record<string, string> = {
                            today: 'Día Actual',
                            '7d': 'Últimos 7 días',
                            '30d': 'Últimos 30 días',
                            custom: 'Personalizado'
                        };
                        const isActive = range === r;
                        return (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                style={{
                                    padding: '0.4rem 0.85rem',
                                    borderRadius: '8px',
                                    border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                                    background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    color: isActive ? '#fff' : 'var(--text-secondary)',
                                    fontSize: '0.8rem',
                                    fontWeight: isActive ? 600 : 400,
                                    cursor: 'pointer'
                                }}
                            >
                                {labels[r]}
                            </button>
                        );
                    })}

                    {range === 'custom' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                            <input
                                type="date"
                                value={customFrom}
                                onChange={(e) => setCustomFrom(e.target.value)}
                                style={{
                                    background: 'var(--bg-dark)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.6rem',
                                    color: '#fff',
                                    fontSize: '0.8rem'
                                }}
                            />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>a</span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={(e) => setCustomTo(e.target.value)}
                                style={{
                                    background: 'var(--bg-dark)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.6rem',
                                    color: '#fff',
                                    fontSize: '0.8rem'
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--error)',
                    borderRadius: '10px',
                    color: '#fca5a5',
                    marginBottom: '1.5rem'
                }}>
                    {error}
                </div>
            )}

            {/* Metrics Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* 1. Total Users Card */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                                Total Usuarios
                            </span>
                            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                                {loading ? '...' : (stats?.summary.totalUsers || 0)}
                            </div>
                        </div>
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '12px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--primary)'
                        }}>
                            <Users size={24} />
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        color: 'var(--success)'
                    }}>
                        <TrendingUp size={14} />
                        <span>+{stats?.summary.newUsersInRange || 0} nuevos en este rango</span>
                    </div>
                </div>

                {/* 2. Password Changes Card */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                                Cambios de Contraseña
                            </span>
                            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                                {loading ? '...' : (stats?.summary.passwordChanges || 0)}
                            </div>
                        </div>
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '12px',
                            background: 'rgba(234, 179, 8, 0.15)',
                            color: '#facc15'
                        }}>
                            <KeyRound size={24} />
                        </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Eventos de recuperación y actualización
                    </div>
                </div>

                {/* 3. 2FA Security Card */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                                Adopción 2FA (MFA)
                            </span>
                            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                                {loading ? '...' : (stats?.summary.mfaEnabledUsers || 0)}
                            </div>
                        </div>
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '12px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: 'var(--success)'
                        }}>
                            <ShieldCheck size={24} />
                        </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#86efac' }}>
                        {mfaRate}% de usuarios con doble factor
                    </div>
                </div>

                {/* 4. Login Activity Rate Card */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                                Tasa de Éxito de Logins
                            </span>
                            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                                {loading ? '...' : `${successLoginRate}%`}
                            </div>
                        </div>
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '12px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8'
                        }}>
                            <BarChart3 size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle2 size={12} /> {stats?.summary.successfulLogins || 0}
                        </span>
                        <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <XCircle size={12} /> {stats?.summary.failedLogins || 0}
                        </span>
                    </div>
                </div>
            </div>

            {/* Registration Breakdown Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '1.5rem'
            }}>
                {/* Left Card: Registration Type Breakdown */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '1.75rem'
                }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Tipo de Registro de Usuarios
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Distribución entre cuentas registradas con credencial tradicional vs proveedores sociales (OAuth).
                    </p>

                    {/* Visual Progress Bar */}
                    <div style={{
                        height: '12px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        display: 'flex',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            width: `${emailPercent}%`,
                            background: 'var(--primary)',
                            transition: 'width 0.4s ease'
                        }} title={`Email: ${emailPercent}%`} />
                        <div style={{
                            width: `${socialPercent}%`,
                            background: '#ec4899',
                            transition: 'width 0.4s ease'
                        }} title={`Redes Sociales: ${socialPercent}%`} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.5)',
                            padding: '1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(99, 102, 241, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary)'
                            }}>
                                <Mail size={18} />
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Email / Contraseña
                                </span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                    {stats?.registrationTypes.email || 0}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '0.4rem', fontWeight: 600 }}>
                                    ({emailPercent}%)
                                </span>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(15, 23, 42, 0.5)',
                            padding: '1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(236, 72, 153, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ec4899'
                            }}>
                                <Share2 size={18} />
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Social / OAuth2
                                </span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                    {stats?.registrationTypes.social || 0}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#f472b6', marginLeft: '0.4rem', fontWeight: 600 }}>
                                    ({socialPercent}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Card: Security & Audit Summary */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '1.75rem'
                }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Auditoría y Salud de Seguridad
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Indicadores clave de mitigación de vulnerabilidades y cumplimiento en el sistema cliente.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.85rem 1rem',
                            background: 'rgba(15, 23, 42, 0.5)',
                            borderRadius: '10px',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <ShieldCheck size={18} color="var(--success)" />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                    Protección MFA / 2FA Obligatoria
                                </span>
                            </div>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                background: mfaRate >= 50 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                color: mfaRate >= 50 ? 'var(--success)' : '#facc15'
                            }}>
                                {mfaRate >= 50 ? 'NIVEL ALTO' : 'RECOMENDADO'}
                            </span>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.85rem 1rem',
                            background: 'rgba(15, 23, 42, 0.5)',
                            borderRadius: '10px',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <KeyRound size={18} color="#facc15" />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                    Registro de Cambios de Contraseña
                                </span>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {stats?.summary.passwordChanges || 0} registrados
                            </span>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.85rem 1rem',
                            background: 'rgba(15, 23, 42, 0.5)',
                            borderRadius: '10px',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <XCircle size={18} color={stats?.summary.failedLogins ? 'var(--error)' : 'var(--text-secondary)'} />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                    Intentos Fallidos de Inicio de Sesión
                                </span>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: (stats?.summary.failedLogins || 0) > 0 ? '#f87171' : 'var(--text-secondary)' }}>
                                {stats?.summary.failedLogins || 0} intentos
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
