import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import { MessageSquare } from 'lucide-react';

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
            <div style={styles.headerBand}>
                <div style={styles.headerContent}>
                    <MessageSquare size={28} color="white" fill="white" />
                    <span style={styles.headerTitle}>WhatsApp Web</span>
                </div>
            </div>

            <div style={styles.cardContainer}>
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.title}>Join WhatsApp Web</h2>
                        <ol style={styles.instructions}>
                            <li>1. Create a free account below</li>
                            <li>2. Chat with friends seamlessly</li>
                            <li>3. Send messages, emojis, and more</li>
                            <li>4. Simple, fast, and secure</li>
                        </ol>
                    </div>

                    <div style={styles.formSection}>
                        {error && <div style={styles.error}>{error}</div>}
                        
                        <form onSubmit={handleRegister} style={styles.form}>
                            <input
                                style={styles.input}
                                type="text"
                                placeholder="Choose a username"
                                value={form.username}
                                onChange={e => setForm({...form, username: e.target.value})}
                                required
                            />
                            <input
                                style={styles.input}
                                type="email"
                                placeholder="Email address"
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

                        <div style={styles.footer}>
                            <p style={styles.linkText}>
                                Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
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
