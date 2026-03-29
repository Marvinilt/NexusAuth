import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/auth/register', { email, password });
            navigate('/login');
        } catch (err: any) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Error al completar el registro');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSocialRegister = (provider: 'google' | 'facebook') => {
        window.location.href = `http://localhost:3000/auth/${provider}`;
    }

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Card className="animate-fade-in">
                <div className="text-center mb-6">
                    <h1>Crear una cuenta</h1>
                    <p>Únete a NexusAuth hoy</p>
                </div>

                {error && <div className="error-text mb-4 text-center">{error}</div>}

                <form onSubmit={handleRegister}>
                    <Input
                        label="Correo electrónico"
                        type="email"
                        placeholder="tu@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="Debe tener al menos 12 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '-1rem', color: 'var(--text-secondary)' }}>
                        Requiere al menos 1 número y 1 símbolo especial.
                    </p>

                    <Button type="submit" loading={loading} className="mb-4">
                        <UserPlus size={18} /> Registrarse
                    </Button>
                </form>

                <div className="divider">O regístrate con</div>

                <Button variant="social" onClick={() => handleSocialRegister('google')} type="button">
                    Google
                </Button>
                <Button variant="social" onClick={() => handleSocialRegister('facebook')} type="button">
                    Facebook
                </Button>

                <p className="text-center mt-4 mb-0" style={{ fontSize: '0.875rem' }}>
                    ¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link>
                </p>
            </Card>
        </div>
    );
}
