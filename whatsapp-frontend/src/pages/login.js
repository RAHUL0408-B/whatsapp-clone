import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, goOnline } from '../services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await login({ email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('email', res.data.email);
            localStorage.setItem('username', res.data.username);

            // Set user online
            await goOnline(res.data.email);

            navigate('/chat');
        } catch (err) {
            setError('Invalid email or password!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.box}>
                <div style={styles.logo}>💬 WhatsApp Clone</div>
                <h2 style={styles.title}>Welcome back</h2>
                <p style={styles.subtitle}>Sign in to continue</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <input
                        style={styles.input}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <input
                        style={styles.input}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <button style={styles.button} type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p style={styles.link}>
                    Don't have an account?{' '}
                    <Link to="/register" style={styles.linkText}>Register</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#111b21',
    },
    box: {
        background: '#202c33',
        padding: '40px',
        borderRadius: '12px',
        width: '380px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    logo: {
        fontSize: '28px',
        textAlign: 'center',
        marginBottom: '20px',
    },
    title: {
        color: '#e9edef',
        textAlign: 'center',
        fontSize: '22px',
        marginBottom: '6px',
    },
    subtitle: {
        color: '#8696a0',
        textAlign: 'center',
        fontSize: '13px',
        marginBottom: '24px',
    },
    error: {
        background: '#ff000022',
        border: '1px solid #ff4444',
        color: '#ff4444',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '13px',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        padding: '12px 14px',
        marginBottom: '14px',
        background: '#2a3942',
        border: '1px solid #374045',
        borderRadius: '8px',
        color: '#e9edef',
        fontSize: '14px',
        outline: 'none',
    },
    button: {
        width: '100%',
        padding: '13px',
        background: '#00a884',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '4px',
    },
    link: {
        color: '#8696a0',
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '13px',
    },
    linkText: {
        color: '#00a884',
        textDecoration: 'none',
    },
};