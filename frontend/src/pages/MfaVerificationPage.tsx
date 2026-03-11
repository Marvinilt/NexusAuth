import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ShieldCheck } from 'lucide-react';

export default function MfaVerificationPage() {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check for mfaToken in the URL (from OAuth redirects) and store it if found.
    React.useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const mfaTokenUrl = queryParams.get('mfaToken');
        if (mfaTokenUrl) {
            localStorage.setItem('mfaToken', mfaTokenUrl);
        }
    }, [location]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // API request automatically picks up 'mfaToken' from localStorage
            const data = await api.post('/mfa/verify-login', { token });

            // Verification successful, log in fully
            login(data.token, data.user);
            navigate('/dashboard');

        } catch (err: any) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Verification failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Card className="animate-fade-in" style={{ textAlign: 'center' }}>
                <div className="mb-6">
                    <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1rem auto' }} />
                    <h2>Two-Factor Authentication</h2>
                    <p>Please enter the 6-digit code from your authenticator app.</p>
                </div>

                {error && <div className="error-text mb-4">{error}</div>}

                <form onSubmit={handleVerify}>
                    <Input
                        label="Security Code"
                        type="text"
                        placeholder="000000"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        required
                        maxLength={6}
                        style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25em' }}
                    />

                    <Button type="submit" loading={loading} className="mt-4">
                        Verify Code
                    </Button>
                </form>
            </Card>
        </div>
    );
}
