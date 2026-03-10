import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');
        const userDataStr = searchParams.get('user');

        if (token && userDataStr) {
            try {
                const user = JSON.parse(userDataStr);
                login(token, user);
                navigate('/dashboard');
            } catch (err) {
                console.error('Failed to parse user data from OAuth callback', err);
                navigate('/login?error=oauth_failed');
            }
        } else {
            // It might be a failure or missing params
            navigate('/login?error=missing_credentials');
        }
    }, [location, login, navigate]);

    return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <h2>Completing secure login...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please wait while we redirect you to your dashboard.</p>
        </div>
    );
}
