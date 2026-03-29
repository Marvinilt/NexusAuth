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
        <div className="container animate-fade-in" style={{ padding: '4rem 2rem' }}>
            <h1>Dashboard</h1>
            <p>¡Bienvenido a NexusAuth! Has iniciado sesión como {user?.email}</p>
            {user?.lastLoginAt && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    <strong>Último inicio de sesión:</strong> {new Date(user.lastLoginAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                    })}
                </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginTop: '2rem' }}>

                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2>Detalles de la Cuenta</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button variant="secondary" onClick={() => window.location.href = '/login-history'} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                                <Clock size={16} /> Histórico de login
                            </Button>
                            <Button variant="secondary" onClick={logout} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                                <LogOut size={16} /> Cerrar sesión
                            </Button>
                        </div>
                    </div>

                    <div className="divider">Configuración de Seguridad</div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.75rem', borderRadius: '50%' }}>
                            <ShieldAlert size={24} color="var(--primary)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>Autenticación de Dos Factores (2FA)</h3>
                            <p style={{ fontSize: '0.875rem' }}>Protege tu cuenta usando una aplicación autenticadora.</p>

                            {!setupData && !backupCodes && (
                                <Button onClick={handleStartMfaSetup} style={{ width: 'auto' }}>Habilitar 2FA</Button>
                            )}
                        </div>
                    </div>

                    {/* MFA Setup QR Code Stage */}
                    {setupData && (
                        <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '8px', marginTop: '1.5rem', border: '1px solid var(--border)' }}>
                            <h4 style={{ marginBottom: '1rem' }}>1. Escanea el código QR</h4>
                            <p style={{ fontSize: '0.875rem' }}>Usa Google Authenticator o Authy para escanear este código.</p>
                            <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '8px', marginBottom: '1rem' }}>
                                <img src={setupData.qrCodeUrl} alt="Código QR de MFA" style={{ width: '200px', height: '200px' }} />
                            </div>

                            <h4 style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>2. Ingresa tu código de 6 dígitos</h4>
                            <form onSubmit={handleVerifyMfaSetup}>
                                <Input
                                    label="Código de Verificación"
                                    value={mfaToken}
                                    onChange={(e) => setMfaToken(e.target.value)}
                                    error={mfaError}
                                    placeholder="000 000"
                                    maxLength={6}
                                    required
                                />
                                <Button type="submit">Completar Configuración</Button>
                            </form>
                        </div>
                    )}

                    {/* MFA Success & Backup Codes */}
                    {backupCodes && (
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', padding: '1.5rem', borderRadius: '8px', marginTop: '1.5rem' }}>
                            <h4 style={{ color: 'var(--success)', marginBottom: '1rem' }}>¡2FA Habilitado Exitosamente!</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Por favor guarda estos códigos de respaldo en un lugar seguro. Puedes usarlos para recuperar tu cuenta si pierdes tu dispositivo.</p>

                            <div style={{ background: 'var(--bg-dark)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace' }}>
                                {backupCodes.map((code, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CodeSquare size={14} color="var(--text-secondary)" /> {code}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </Card>
            </div>
        </div>
    );
}
