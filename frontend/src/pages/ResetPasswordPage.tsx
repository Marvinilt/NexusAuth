import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Token de recuperación inválido o inexistente. Por favor solicita un nuevo enlace.');
        }
    }, [token]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/recovery/reset-password', { token, newPassword: password });
            setSuccess(true);
        } catch (err: any) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Error al restablecer la contraseña.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Card className="animate-fade-in">
                <div className="text-center mb-6">
                    <h1>Establecer Nueva Contraseña</h1>
                    <p>Por favor ingresa tu nueva contraseña segura</p>
                </div>

                {error && <div className="error-text mb-4 text-center">{error}</div>}

                {!success ? (
                    <form onSubmit={handleReset}>
                        <Input
                            label="Nueva Contraseña"
                            type="password"
                            placeholder="Debe tener al menos 12 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={!token}
                        />
                        <p style={{ fontSize: '0.75rem', marginTop: '-1rem', color: 'var(--text-secondary)' }}>
                            Requiere al menos 1 número y 1 símbolo especial.
                        </p>
                        <Button type="submit" loading={loading} disabled={!token} className="mt-4">
                            Actualizar Contraseña
                        </Button>
                    </form>
                ) : (
                    <div className="text-center">
                        <CheckCircle2 color="var(--success)" size={48} style={{ margin: '0 auto 1.5rem auto' }} />
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>¡Contraseña Actualizada!</h2>
                        <p className="mb-6">Tu contraseña ha sido cambiada exitosamente.</p>
                        <Button onClick={() => navigate('/login')}>Ir a Iniciar Sesión</Button>
                    </div>
                )}

                {!success && (
                    <p className="text-center mt-6 mb-0" style={{ fontSize: '0.875rem' }}>
                        <Link to="/login">Cancelar</Link>
                    </p>
                )}
            </Card>
        </div>
    );
}
