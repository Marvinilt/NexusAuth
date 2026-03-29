import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ShieldAlert, LogOut, CodeSquare, Clock } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuth();

    const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
    const [mfaToken, setMfaToken] = useState('');
    const [mfaError, setMfaError] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

    const handleStartMfaSetup = async () => {
        try {
            const data = await api.post('/mfa/setup', {});
            setSetupData(data);
            setBackupCodes(null);
        } catch (err: any) {
            setMfaError('Error al iniciar la configuración de MFA.');
        }
    };

    const handleVerifyMfaSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await api.post('/mfa/verify-setup', { token: mfaToken });
            setBackupCodes(data.backupCodes);
            setSetupData(null); // finish setup
        } catch (err: any) {
            if (err instanceof ApiError) {
                setMfaError(err.message);
            } else {
                setMfaError('Código de Verificación Inválido');
            }
        }
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '1.5rem 2rem', position: 'relative' }}>
            {/* User Logout Area */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <Button 
                    variant="secondary" 
                    onClick={logout} 
                    style={{ 
                        padding: '0.35rem 0.7rem', 
                        fontSize: '0.75rem', 
                        width: 'auto', 
                        opacity: 0.8, 
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-secondary)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                    }}
                >
                    <LogOut size={14} /> Cerrar Sesion
                </Button>
            </div>

            {/* Header / Greeting - More compact */}
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '2rem', border: '1px solid rgba(99, 102, 241, 0.2)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Gestión de Identidad
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>
                    Panel de <span style={{ color: 'var(--primary)' }}>Control</span>
                </h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', opacity: 0.8 }}>
                    Bienvenido, {user?.email}. Administra tu seguridad y actividad.
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                
                {/* Profile Information Card - Compact */}
                <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ 
                            width: '48px', height: '48px', 
                            background: 'linear-gradient(135deg, var(--primary), #818cf8)', 
                            borderRadius: '12px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 12px -3px rgba(99, 102, 241, 0.3)'
                        }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                                {user?.email[0].toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Perfil Personal</h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {user?.id.substring(0, 8)}...</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                                <CodeSquare size={16} color="var(--primary)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.email}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                                <Clock size={16} color="var(--primary)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ultimo Acceso</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                    {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Sesión Actual'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <Button 
                            variant="secondary" 
                            onClick={() => window.location.href = '/login-history'} 
                            style={{ 
                                background: 'rgba(255,255,255,0.03)', 
                                border: '1px solid var(--border)',
                                fontSize: '0.85rem',
                                padding: '0.6rem'
                            }}
                        >
                            Ver Historial de Accesos
                        </Button>
                    </div>
                </Card>

                {/* Security (2FA) Setup Card - Compact */}
                <Card style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'rgba(34, 197, 94, 0.15)', borderRadius: '8px' }}>
                            <ShieldAlert size={18} color="var(--success)" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Seguridad 2FA</h2>
                    </div>

                    {!setupData && !backupCodes ? (
                        <>
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                                Protege tu cuenta incluso si tu contraseña ha sido filtrada.
                            </p>
                            
                            <div style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    <li style={{ marginBottom: '0.4rem' }}>Tokens TOTP temporales</li>
                                    <li>Códigos Maestros de respaldo</li>
                                </ul>
                            </div>

                            <Button onClick={handleStartMfaSetup} style={{ padding: '0.75rem', background: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                                Configurar Protección 2FA
                            </Button>
                        </>
                    ) : (
                        <div>
                            {setupData && (
                                <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)', fontSize: '1rem' }}>Sincronización</h4>
                                    <div style={{ textAlign: 'center', background: '#fff', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
                                        <img src={setupData.qrCodeUrl} alt="QR MFA" style={{ width: '120px', height: '120px' }} />
                                    </div>
                                    <form onSubmit={handleVerifyMfaSetup}>
                                        <Input
                                            label="Código de 6 dígitos"
                                            value={mfaToken}
                                            onChange={(e) => setMfaToken(e.target.value)}
                                            error={mfaError}
                                            placeholder="······"
                                            maxLength={6}
                                            required
                                            style={{ textAlign: 'center', fontSize: '1.2rem', padding: '0.5rem' }}
                                        />
                                        <Button type="submit" style={{ marginTop: '0.75rem', padding: '0.6rem' }}>Confirmar Activación</Button>
                                    </form>
                                </div>
                            )}

                            {backupCodes && (
                                <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid var(--success)', padding: '1.25rem', borderRadius: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <ShieldAlert size={16} color="var(--success)" />
                                        <h4 style={{ color: 'var(--success)', margin: 0, fontSize: '1.1rem' }}>¡Activo!</h4>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', marginBottom: '0.75rem', color: 'var(--text-primary)', opacity: 0.8 }}>Guarda estos códigos maestros:</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                        {backupCodes.map((code, i) => (
                                            <div key={i} style={{ fontFamily: 'monospace', color: 'var(--success)', fontSize: '0.8rem' }}>{code}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
