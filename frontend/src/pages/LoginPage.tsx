import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Mail, Lock, LogIn, Github, Facebook } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api.post('/auth/login', { email, password });

            if (data.mfaRequired) {
                // Transitional stage setup
                localStorage.removeItem('token'); // Clear any old expired full token
                localStorage.setItem('mfaToken', data.mfaToken);
                navigate('/mfa-verify');
            } else {
                login(data.token, data.user);
                navigate('/dashboard');
            }

        } catch (err: any) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: 'google' | 'facebook' | 'github') => {
        // Redirects browser to backend which initiates the OAuth flow
        const apiKey = import.meta.env.VITE_NEXUS_API_KEY || '';
        window.location.href = `http://localhost:3000/auth/${provider}?apiKey=${apiKey}`;
    }

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Card className="animate-fade-in">
                <div className="text-center mb-6">
                    <h1>Bienvenido de nuevo</h1>
                    <p>Inicia sesión en tu cuenta de NexusAuth</p>
                </div>

                {error && <div className="error-text mb-4 text-center">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ position: 'relative' }}>
                        <Mail className="lucide-icon" size={18} style={{ position: 'absolute', top: '38px', left: '12px', color: 'var(--text-secondary)' }} />
                        <Input
                            label="Correo electrónico"
                            type="email"
                            placeholder="tu@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock className="lucide-icon" size={18} style={{ position: 'absolute', top: '38px', left: '12px', color: 'var(--text-secondary)' }} />
                        <Input
                            label="Contraseña"
                            type="password"
                            placeholder="Ingresa tu contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-1rem', marginBottom: '1.5rem' }}>
                        <Link to="/forgot-password" style={{ fontSize: '0.875rem' }}>¿Olvidaste tu contraseña?</Link>
                    </div>

                    <Button type="submit" loading={loading} className="mb-4">
                        <LogIn size={18} /> Iniciar Sesión
                    </Button>
                </form>

                <div className="divider">O continúa con</div>

                <Button variant="social" onClick={() => handleSocialLogin('google')} type="button">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.162-1.9 4.155C17.202 19.332 15.39 20.34 12.48 20.34c-4.987 0-8.1-3.042-8.1-8.34s3.113-8.34 8.1-8.34c2.85 0 4.5 1.1 5.4 1.9l2.35-2.35C20.55 1.5 17.1 0 12.48 0 5.82 0 0 5.58 0 12.48s5.82 12.48 12.48 12.48c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.49-.17-2.15l-11.04-.002z" />
                    </svg>
                    Google
                </Button>
                <Button variant="social" onClick={() => handleSocialLogin('facebook')} type="button">
                    <Facebook size={18} /> Facebook
                </Button>
                <Button variant="social" onClick={() => handleSocialLogin('github')} type="button">
                    <Github size={18} /> GitHub
                </Button>

                <p className="text-center mt-4 mb-0" style={{ fontSize: '0.875rem' }}>
                    ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
                </p>
            </Card>
        </div>
    );
}
