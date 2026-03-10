import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await api.post('/recovery/forgot-password', { email });
            setSuccess('If this email is registered, we have sent a reset link. Check your inbox.');
        } catch (err: any) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Failed to send recovery request.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Card className="animate-fade-in">
                <div className="text-center mb-6">
                    <KeyRound size={48} color="var(--primary)" style={{ margin: '0 auto 1rem auto' }} />
                    <h1>Forgot Password</h1>
                    <p>We'll send you a link to reset your password</p>
                </div>

                {error && <div className="error-text mb-4 text-center">{error}</div>}
                {success && <div className="success-text mb-4 text-center">{success}</div>}

                <form onSubmit={handleResetRequest}>
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={success !== ''}
                    />
                    <Button type="submit" loading={loading} disabled={success !== ''} className="mt-4">
                        Send Reset Link
                    </Button>
                </form>

                <p className="text-center mt-6 mb-0" style={{ fontSize: '0.875rem' }}>
                    Remembered your password? <Link to="/login">Back to Sign In</Link>
                </p>
            </Card>
        </div>
    );
}
