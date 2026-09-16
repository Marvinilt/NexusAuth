import { useState, useEffect } from 'react';
import { api, ApiError } from '../../api';
import { 
    ScrollText, 
    Building2, 
    Search, 
    CheckCircle2, 
    XCircle, 
    MapPin, 
    Laptop, 
    Clock, 
    RefreshCcw,
    Filter,
    Map
} from 'lucide-react';
import { MapModal } from '../../components/MapModal';

interface Client {
    id: string;
    name: string;
}

interface LoginLog {
    id: string;
    status: 'SUCCESS' | 'FAILED';
    ipAddress: string | null;
    userAgent: string | null;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
    user: {
        id: string;
        email: string;
    };
    client: {
        id: string;
        name: string;
    } | null;
}

export default function LogsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('all');
    const [searchEmail, setSearchEmail] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'SUCCESS' | 'FAILED'>('all');
    const [limit, setLimit] = useState<number>(100);

    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLogForMap, setSelectedLogForMap] = useState<LoginLog | null>(null);

    // Fetch clients for dropdown
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await api.get('/clients');
                setClients(data);
            } catch {
                // Silently handle if client fetch fails
            }
        };
        fetchClients();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            let query = `/admin/logs?limit=${limit}`;
            if (selectedClient && selectedClient !== 'all') {
                query += `&clientId=${selectedClient}`;
            }
            if (searchEmail.trim()) {
                query += `&email=${encodeURIComponent(searchEmail.trim())}`;
            }
            if (statusFilter !== 'all') {
                query += `&status=${statusFilter}`;
            }

            const data = await api.get(query);
            setLogs(data);
        } catch (err: unknown) {
            const msg = err instanceof ApiError ? err.message : 'Error al cargar logs de auditoría';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchLogs();
        }, 300);
        return () => clearTimeout(debounce);
    }, [selectedClient, searchEmail, statusFilter, limit]);

    const formatBrowser = (ua: string | null) => {
        if (!ua) return 'Desconocido';
        if (ua.includes('Chrome')) return 'Google Chrome';
        if (ua.includes('Firefox')) return 'Mozilla Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Apple Safari';
        if (ua.includes('Edge')) return 'Microsoft Edge';
        if (ua.includes('Postman')) return 'Postman Client';
        return ua.length > 30 ? ua.substring(0, 30) + '...' : ua;
    };

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
                        Logs de <span style={{ color: 'var(--primary)' }}>Auditoría Multicliente</span>
                    </h1>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Supervisa y audita en tiempo real los accesos a través de todos los sistemas clientes conectados.
                    </p>
                </div>

                <button
                    onClick={fetchLogs}
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
                    Refrescar Logs
                </button>
            </div>

            {/* Filter Toolbar */}
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
                {/* 1. Client Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={16} color="var(--primary)" />
                    <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
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

                {/* 2. Email Search Input */}
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
                        placeholder="Filtrar por correo de usuario..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
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
                            onClick={() => setSearchEmail('')}
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

                {/* 3. Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Filter size={15} color="var(--text-secondary)" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'SUCCESS' | 'FAILED')}
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
                        <option value="all">Todos los estados</option>
                        <option value="SUCCESS">Solo Exitosos</option>
                        <option value="FAILED">Solo Fallidos</option>
                    </select>
                </div>

                {/* 4. Limit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Límite:</span>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        style={{
                            background: 'var(--bg-dark)',
                            color: '#fff',
                            border: '1px solid var(--border)',
                            padding: '0.5rem 0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </select>
                </div>
            </div>

            {/* Error Message */}
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

            {/* Logs Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    Cargando bitácora de accesos...
                </div>
            ) : logs.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '16px',
                    border: '1px dashed var(--border)'
                }}>
                    <ScrollText size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No se encontraron registros</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                        No hay eventos de inicio de sesión que coincidan con los filtros seleccionados.
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
                    <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{
                                borderBottom: '1px solid var(--border)',
                                background: 'rgba(15, 23, 42, 0.6)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <th style={{ padding: '1rem 1.5rem' }}>Estado</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Usuario (Email)</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Sistema Cliente</th>
                                <th style={{ padding: '1rem 1.5rem' }}>IP y Navegador</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Ubicación</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Fecha y Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => {
                                const isSuccess = log.status === 'SUCCESS';
                                return (
                                    <tr 
                                        key={log.id}
                                        style={{
                                            borderBottom: '1px solid var(--border)',
                                            fontSize: '0.875rem',
                                            transition: 'background 0.15s ease'
                                        }}
                                    >
                                        {/* Status */}
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: isSuccess ? 'var(--success)' : '#f87171',
                                                border: `1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                            }}>
                                                {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {isSuccess ? 'EXITOSO' : 'FALLIDO'}
                                            </span>
                                        </td>

                                        {/* User Email */}
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {log.user?.email || 'Desconocido'}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                ID: {log.user?.id.substring(0, 8)}...
                                            </div>
                                        </td>

                                        {/* Client System */}
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {log.client ? (
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                                    padding: '0.25rem 0.55rem',
                                                    borderRadius: '6px',
                                                    color: '#a5b4fc',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500
                                                }}>
                                                    <Building2 size={13} />
                                                    {log.client.name}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                    NexusAuth Directo
                                                </span>
                                            )}
                                        </td>

                                        {/* IP & Browser */}
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                                                {log.ipAddress || '127.0.0.1'}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                fontSize: '0.75rem',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                <Laptop size={12} />
                                                <span>{formatBrowser(log.userAgent)}</span>
                                            </div>
                                        </td>

                                        {/* Location */}
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                                            {log.latitude && log.longitude ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedLogForMap(log)}
                                                    title={`Ver mapa en ${log.location || 'coordenadas registradas'}`}
                                                    aria-label={`Ver mapa interactivo de ${log.location || 'la ubicación'}`}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.45rem',
                                                        background: 'rgba(99, 102, 241, 0.1)',
                                                        border: '1px solid rgba(99, 102, 241, 0.28)',
                                                        color: '#c7d2fe',
                                                        padding: '0.35rem 0.65rem',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.825rem',
                                                        fontWeight: 500,
                                                        textAlign: 'left',
                                                        transition: 'all 0.18s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.22)';
                                                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.55)';
                                                        e.currentTarget.style.color = '#ffffff';
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.28)';
                                                        e.currentTarget.style.color = '#c7d2fe';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <MapPin size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                                                    <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                                                        {log.location || 'Ver mapa'}
                                                    </span>
                                                    <Map size={12} style={{ opacity: 0.75, marginLeft: '0.15rem' }} />
                                                </button>
                                            ) : (
                                                <div 
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}
                                                    title="Sin coordenadas GPS para visualizar en el mapa"
                                                >
                                                    <MapPin size={13} style={{ opacity: 0.4 }} />
                                                    <span>{log.location || 'Localhost (Dev)'}</span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Timestamp */}
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Clock size={13} />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Ubicación en Mapa */}
            <MapModal
                data={selectedLogForMap && selectedLogForMap.latitude && selectedLogForMap.longitude ? {
                    id: selectedLogForMap.id,
                    location: selectedLogForMap.location,
                    latitude: selectedLogForMap.latitude,
                    longitude: selectedLogForMap.longitude,
                    ipAddress: selectedLogForMap.ipAddress,
                    userAgent: selectedLogForMap.userAgent,
                    status: selectedLogForMap.status,
                    createdAt: selectedLogForMap.createdAt,
                    userEmail: selectedLogForMap.user?.email,
                    clientName: selectedLogForMap.client?.name ?? 'NexusAuth Directo'
                } : null}
                onClose={() => setSelectedLogForMap(null)}
            />
        </div>
    );
}
