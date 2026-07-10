import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, goOnline } from '../services/api';
import { MessageSquare } from 'lucide-react';

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
            <div style={styles.headerBand}>
                <div style={styles.headerContent}>
                    <MessageSquare size={28} color="white" fill="white" />
                    <span style={styles.headerTitle}>WhatsApp Web</span>
                </div>
            </div>

            <div style={styles.cardContainer}>
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.title}>Use WhatsApp on your computer</h2>
                        <ol style={styles.instructions}>
                            <li>1. Open WhatsApp on your phone</li>
                            <li>2. Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong></li>
                            <li>3. Tap on <strong>Link a device</strong></li>
                            <li>4. (For this clone, just login below!)</li>
                        </ol>
                    </div>

                    <div style={styles.formSection}>
                        {error && <div style={styles.error}>{error}</div>}
                        
                        <form onSubmit={handleLogin} style={styles.form}>
                            <input
                                style={styles.input}
                                type="email"
                                placeholder="Email address"
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
                                {loading ? 'Logging in...' : 'Log In'}
                            </button>
                        </form>

                        <div style={styles.footer}>
                            <p style={styles.linkText}>
                                Need an account? <Link to="/register" style={styles.link}>Get started</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#111b21',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
    },
    headerBand: {
        height: '222px',
        width: '100%',
        backgroundColor: '#00a884',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
    },
    headerContent: {
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '28px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    headerTitle: {
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    cardContainer: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        marginTop: '60px',
    },
    card: {
        backgroundColor: '#202c33',
        borderRadius: '3px',
        width: '100%',
        maxWidth: '1000px',
        minHeight: '400px',
        display: 'flex',
        boxShadow: '0 17px 50px 0 rgba(11,20,26,.19), 0 12px 15px 0 rgba(11,20,26,.24)',
        padding: '60px',
        gap: '60px',
    },
    cardHeader: {
        flex: 1,
    },
    title: {
        color: '#e9edef',
        fontSize: '28px',
        fontWeight: '300',
        marginBottom: '40px',
    },
    instructions: {
        color: '#8696a0',
        fontSize: '18px',
        lineHeight: '28px',
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    formSection: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        maxWidth: '350px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    input: {
        width: '100%',
        padding: '16px',
        backgroundColor: '#111b21',
        border: 'none',
        borderRadius: '6px',
        color: '#e9edef',
        fontSize: '16px',
        outline: 'none',
    },
    button: {
        width: '100%',
        padding: '16px',
        backgroundColor: '#00a884',
        color: '#111b21',
        border: 'none',
        borderRadius: '24px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background 0.2s',
        marginTop: '10px',
    },
    error: {
        color: '#f15c6d',
        backgroundColor: 'rgba(241, 92, 109, 0.1)',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '20px',
        fontSize: '14px',
        textAlign: 'center',
    },
    footer: {
        marginTop: '40px',
        textAlign: 'center',
    },
    linkText: {
        color: '#8696a0',
        fontSize: '15px',
    },
    link: {
        color: '#00a884',
        textDecoration: 'none',
        fontWeight: '500',
    }
};