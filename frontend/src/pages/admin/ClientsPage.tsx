import React, { useState, useEffect } from 'react';
import { api, ApiError } from '../../api';
import { 
    Building2, 
    Plus, 
    Key, 
    Copy, 
    Check, 
    Eye, 
    EyeOff, 
    RefreshCw, 
    Trash2, 
    Globe, 
    Calendar,
    X
} from 'lucide-react';

interface Client {
    id: string;
    name: string;
    apiKey: string;
    allowedOrigins: string[];
    createdAt: string;
    updatedAt: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [allowedOrigins, setAllowedOrigins] = useState('');
    const [creating, setCreating] = useState(false);
    const [createSuccessClient, setCreateSuccessClient] = useState<Client | null>(null);

    // API Key visibility & copy state
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Action state (regenerate / delete)
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchClients = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.get('/clients');
            setClients(data);
        } catch (err: unknown) {
            const msg = err instanceof ApiError ? err.message : 'Error al cargar sistemas clientes';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const toggleKeyVisibility = (id: string) => {
        setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setCreating(true);
            setError(null);
            const originsArray = allowedOrigins
                .split(',')
                .map(o => o.trim())
                .filter(o => o.length > 0);

            const res = await api.post('/clients', {
                name: name.trim(),
                allowedOrigins: originsArray
            });

            setCreateSuccessClient(res.client);
            setName('');
            setAllowedOrigins('');
            fetchClients();
        } catch (err: unknown) {
            const msg = err instanceof ApiError ? err.message : 'No se pudo crear el cliente';
            setError(msg);
        } finally {
            setCreating(false);
        }
    };

    const handleRegenerateKey = async (client: Client) => {
        const confirmed = window.confirm(
            `¿Estás seguro de regenerar el API Key para "${client.name}"?\n\nADVERTENCIA: Las aplicaciones cliente que usen el API Key actual dejarán de funcionar hasta que actualicen su credencial.`
        );
        if (!confirmed) return;

        try {
            setProcessingId(client.id);
            const res = await api.post(`/clients/${client.id}/regenerate-key`, {});
            // Actualizar cliente localmente
            setClients(prev => prev.map(c => c.id === client.id ? res.client : c));
            // Asegurar que la nueva clave sea visible para que el admin la vea
            setVisibleKeys(prev => ({ ...prev, [client.id]: true }));
        } catch (err: unknown) {
            const msg = err instanceof ApiError ? err.message : 'Error al regenerar el API Key';
            alert(msg);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteClient = async (client: Client) => {
        const confirmed = window.confirm(
            `¿Deseas eliminar definitivamente el sistema cliente "${client.name}"?\n\nEsta acción eliminará todos los usuarios y registros asociados de forma permanente.`
        );
        if (!confirmed) return;

        try {
            setProcessingId(client.id);
            await api.delete(`/clients/${client.id}`);
            setClients(prev => prev.filter(c => c.id !== client.id));
        } catch (err: unknown) {
            const msg = err instanceof ApiError ? err.message : 'Error al eliminar cliente';
            alert(msg);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
                        Sistemas <span style={{ color: 'var(--primary)' }}>Clientes</span>
                    </h1>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Administra las aplicaciones integradas con NexusAuth, sus credenciales y orígenes permitidos (CORS).
                    </p>
                </div>
                <button
                    onClick={() => {
                        setCreateSuccessClient(null);
                        setIsCreateOpen(true);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        background: 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                        transition: 'transform 0.15s ease'
                    }}
                >
                    <Plus size={18} />
                    Nuevo Sistema Cliente
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--error)',
                    borderRadius: '10px',
                    color: '#fca5a5',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem'
                }}>
                    {error}
                </div>
            )}

            {/* Clients Table / Content */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    Cargando sistemas clientes...
                </div>
            ) : clients.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '16px',
                    border: '1px dashed var(--border)'
                }}>
                    <Building2 size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No hay clientes registrados</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                        Crea el primer sistema cliente para generar su API Key y conectar aplicaciones externas.
                    </p>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        style={{
                            padding: '0.65rem 1.25rem',
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Crear Primer Cliente
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    width: '100%'
                }}>
                    {clients.map((client) => {
                        const isKeyVisible = !!visibleKeys[client.id];
                        const isCopied = copiedId === client.id;
                        const isProcessing = processingId === client.id;

                        return (
                            <div 
                                key={client.id}
                                style={{
                                    background: 'rgba(30, 41, 59, 0.6)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border)',
                                    padding: '1.25rem 1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                                }}
                            >
                                {/* Top Row: Info & Actions */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '0.75rem'
                                }}>
                                    {/* Client Identity */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '200px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'rgba(99, 102, 241, 0.12)',
                                            border: '1px solid rgba(99, 102, 241, 0.25)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--primary)',
                                            flexShrink: 0
                                        }}>
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                                                {client.name}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    color: 'var(--text-secondary)',
                                                    fontFamily: 'monospace',
                                                    background: 'rgba(15, 23, 42, 0.7)',
                                                    padding: '0.15rem 0.45rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(255, 255, 255, 0.06)'
                                                }}>
                                                    ID: {client.id}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}>
                                                    <Calendar size={12} />
                                                    {new Date(client.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        alignItems: 'center',
                                        flexWrap: 'wrap'
                                    }}>
                                        <button
                                            onClick={() => handleRegenerateKey(client)}
                                            disabled={isProcessing}
                                            title="Regenerar credenciales (nuevo API Key)"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                padding: '0.5rem 0.85rem',
                                                background: 'rgba(234, 179, 8, 0.1)',
                                                border: '1px solid rgba(234, 179, 8, 0.3)',
                                                color: '#facc15',
                                                borderRadius: '8px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <RefreshCw size={13} className={isProcessing ? "animate-spin" : ""} />
                                            Regenerar Key
                                        </button>

                                        <button
                                            onClick={() => handleDeleteClient(client)}
                                            disabled={isProcessing}
                                            title="Eliminar cliente"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.7rem',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#f87171',
                                                borderRadius: '8px',
                                                fontSize: '0.8rem',
                                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Grid: Credentials & CORS */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                    gap: '0.85rem',
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    padding: '0.85rem 1rem'
                                }}>
                                    {/* API Key Box */}
                                    <div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            textTransform: 'uppercase',
                                            color: 'var(--text-secondary)',
                                            fontWeight: 600,
                                            letterSpacing: '0.05em',
                                            marginBottom: '0.35rem'
                                        }}>
                                            API Key (Credencial de Acceso)
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '0.5rem',
                                            background: 'rgba(15, 23, 42, 0.85)',
                                            border: '1px solid var(--border)',
                                            padding: '0.4rem 0.65rem',
                                            borderRadius: '8px',
                                            fontFamily: 'monospace',
                                            fontSize: '0.82rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', minWidth: 0 }}>
                                                <Key size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                                                <span 
                                                    style={{
                                                        color: isKeyVisible ? '#38bdf8' : 'var(--text-secondary)',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                    title={isKeyVisible ? client.apiKey : undefined}
                                                >
                                                    {isKeyVisible ? client.apiKey : '••••••••••••••••••••••••••••••••'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                                                <button
                                                    onClick={() => toggleKeyVisibility(client.id)}
                                                    title={isKeyVisible ? "Ocultar API Key" : "Revelar API Key"}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        borderRadius: '4px'
                                                    }}
                                                >
                                                    {isKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => copyToClipboard(client.apiKey, client.id)}
                                                    title="Copiar API Key"
                                                    style={{
                                                        background: isCopied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                        border: `1px solid ${isCopied ? 'var(--success)' : 'var(--border)'}`,
                                                        color: isCopied ? 'var(--success)' : 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        padding: '0.25rem 0.55rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 600,
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                                                    <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Allowed Origins (CORS) */}
                                    <div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            textTransform: 'uppercase',
                                            color: 'var(--text-secondary)',
                                            fontWeight: 600,
                                            letterSpacing: '0.05em',
                                            marginBottom: '0.35rem'
                                        }}>
                                            Orígenes Permitidos (CORS)
                                        </div>
                                        <div style={{
                                            minHeight: '34px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '0.35rem'
                                        }}>
                                            {client.allowedOrigins && client.allowedOrigins.length > 0 ? (
                                                client.allowedOrigins.map((origin, idx) => (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.3rem',
                                                            background: 'rgba(99, 102, 241, 0.1)',
                                                            color: '#a5b4fc',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            border: '1px solid rgba(99, 102, 241, 0.2)'
                                                        }}
                                                    >
                                                        <Globe size={11} />
                                                        {origin}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                    Sin orígenes restringidos (acceso libre)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: Nuevo Cliente */}
            {isCreateOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: '#1e293b',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '520px',
                        padding: '2rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        position: 'relative'
                    }}>
                        {/* Close button */}
                        <button
                            onClick={() => setIsCreateOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '1.25rem',
                                right: '1.25rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(99, 102, 241, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Building2 size={22} color="var(--primary)" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Nuevo Sistema Cliente</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Registra una nueva aplicación para emitirle credenciales de autenticación.
                                </p>
                            </div>
                        </div>

                        {createSuccessClient ? (
                            <div style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid var(--success)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    <Check size={18} /> ¡Sistema cliente registrado con éxito!
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                                    Copia el API Key ahora. Deberás configurarlo en la cabecera <code>x-api-key</code> de tu cliente:
                                </p>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'var(--bg-dark)',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem',
                                    color: '#38bdf8',
                                    border: '1px solid var(--border)'
                                }}>
                                    <span>{createSuccessClient.apiKey}</span>
                                    <button
                                        onClick={() => copyToClipboard(createSuccessClient.apiKey, 'modal-new')}
                                        style={{
                                            background: 'var(--primary)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '0.35rem 0.75rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem'
                                        }}
                                    >
                                        {copiedId === 'modal-new' ? <Check size={14} /> : <Copy size={14} />}
                                        {copiedId === 'modal-new' ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setCreateSuccessClient(null);
                                        setIsCreateOpen(false);
                                    }}
                                    style={{
                                        marginTop: '1.25rem',
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cerrar Ventana
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateClient}>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                                        Nombre de la Aplicación / Cliente *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ej: Portal Clientes, Tienda Móvil, App Facturación"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'var(--bg-dark)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                                        Orígenes Permitidos (CORS)
                                    </label>
                                    <input
                                        type="text"
                                        value={allowedOrigins}
                                        onChange={(e) => setAllowedOrigins(e.target.value)}
                                        placeholder="http://localhost:5173, https://miapp.com"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'var(--bg-dark)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                                        Separa múltiples URLs con comas. Deja en blanco si no deseas restringir orígenes web.
                                    </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(false)}
                                        style={{
                                            padding: '0.65rem 1.25rem',
                                            background: 'transparent',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !name.trim()}
                                        style={{
                                            padding: '0.65rem 1.5rem',
                                            background: 'var(--primary)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            cursor: (creating || !name.trim()) ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {creating ? 'Registrando...' : 'Crear y Generar Key'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
