import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';

export default function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await register(form);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.box}>
                <div style={styles.logo}>💬 WhatsApp Clone</div>
                <h2 style={styles.title}>Create account</h2>
                <p style={styles.subtitle}>Join WhatsApp Clone today</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleRegister}>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Username"
                        value={form.username}
                        onChange={e => setForm({...form, username: e.target.value})}
                        required
                    />
                    <input
                        style={styles.input}
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        required
                    />
                    <input
                        style={styles.input}
                        type="password"
                        placeholder="Password (min 6 chars)"
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})}
                        required
                    />
                    <button style={styles.button} type="submit" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p style={styles.link}>
                    Already have an account?{' '}
                    <Link to="/login" style={styles.linkText}>Sign In</Link>
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
