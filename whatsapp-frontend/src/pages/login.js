import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, goOnline } from '../services/api';
import { MessageSquare, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('rahul123@gmail.com');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const demoUsers = [
        { name: 'Rahul', email: 'rahul123@gmail.com', avatar: 'R', color: '#00a884' },
        { name: 'Sarah Connor', email: 'sarah@example.com', avatar: 'S', color: '#6f42c1' },
        { name: 'Emily Watson', email: 'emily@example.com', avatar: 'E', color: '#d97706' },
        { name: 'David Miller', email: 'david@example.com', avatar: 'D', color: '#0284c7' },
        { name: 'Alex Rivera', email: 'alex@example.com', avatar: 'A', color: '#e11d48' },
    ];

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await login({ email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('email', res.data.email);
            localStorage.setItem('username', res.data.username);

            // Set user online
            try {
                await goOnline(res.data.email);
            } catch (err) {
                // non-blocking
            }

            navigate('/chat');
        } catch (err) {
            console.error('Login error:', err);
            const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            if (err.response?.status === 403 || err.response?.status === 401) {
                setError('Invalid email or password. Please verify your credentials.');
            } else if (!err.response) {
                setError('Cannot connect to WhatsApp server on port 8080. Please ensure the backend is running.');
            } else {
                setError(`Login failed: ${serverMsg}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDemoUser = (userEmail) => {
        setEmail(userEmail);
        setPassword('123456');
        setError('');
    };

    return (
        <div style={styles.container}>
            {/* WhatsApp Top Header Band */}
            <div style={styles.headerBand}>
                <div style={styles.headerContent}>
                    <div style={styles.brandLogo}>
                        <MessageSquare size={26} color="white" fill="white" />
                    </div>
                    <span style={styles.headerTitle}>WHATSAPP WEB</span>
                </div>
            </div>

            {/* Centered Login Card */}
            <div style={styles.cardContainer}>
                <div style={styles.card}>
                    
                    {/* Left: Instructions & 1-Click Accounts */}
                    <div style={styles.leftSection}>
                        <h2 style={styles.title}>Use WhatsApp on your computer</h2>
                        <ol style={styles.instructions}>
                            <li>1. Open WhatsApp on your browser</li>
                            <li>2. Select any demo account below or enter your email</li>
                            <li>3. Instant password is <strong>123456</strong> for all demo users</li>
                            <li>4. Tap <strong>Log In</strong> to enter the real-time chat!</li>
                        </ol>

                        {/* 1-Click Demo Accounts Selector */}
                        <div style={styles.demoSection}>
                            <div style={styles.demoSectionTitle}>
                                <CheckCircle2 size={15} color="#00a884" style={{ marginRight: '6px' }} />
                                <span>Choose a Demo Account (1-Click):</span>
                            </div>
                            <div style={styles.demoChipsList}>
                                {demoUsers.map((u) => {
                                    const isSelected = email === u.email;
                                    return (
                                        <button
                                            key={u.email}
                                            type="button"
                                            onClick={() => handleSelectDemoUser(u.email)}
                                            style={{
                                                ...styles.demoChip,
                                                borderColor: isSelected ? '#00a884' : '#2f3b43',
                                                backgroundColor: isSelected ? 'rgba(0, 168, 132, 0.15)' : '#202c33',
                                            }}
                                        >
                                            <div style={{ ...styles.demoChipAvatar, backgroundColor: u.color }}>
                                                {u.avatar}
                                            </div>
                                            <span style={styles.demoChipText}>{u.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: Login Form */}
                    <div style={styles.rightSection}>
                        <div style={styles.formHeader}>
                            <h3 style={styles.formTitle}>Account Login</h3>
                            <p style={styles.formSub}>Enter your credentials or click a demo user</p>
                        </div>

                        {error && (
                            <div style={styles.errorBox}>
                                <AlertCircle size={18} color="#f15c6d" style={{ marginRight: '8px', flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        <form onSubmit={handleLogin} style={styles.form}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Email Address</label>
                                <input
                                    style={styles.input}
                                    type="email"
                                    placeholder="e.g. rahul123@gmail.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Password</label>
                                <div style={styles.passwordWrapper}>
                                    <input
                                        style={styles.passwordInput}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={styles.eyeBtn}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={18} color="var(--icon-color)" /> : <Eye size={18} color="var(--icon-color)" />}
                                    </button>
                                </div>
                            </div>

                            <button style={styles.loginBtn} type="submit" disabled={loading}>
                                {loading ? 'Logging in...' : 'Log In to WhatsApp'}
                            </button>
                        </form>

                        <div style={styles.footer}>
                            <p style={styles.linkText}>
                                Want a fresh account? <Link to="/register" style={styles.link}>Register here</Link>
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
        width: '100vw',
        backgroundColor: '#0c1317',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    headerBand: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '222px',
        backgroundColor: '#00a884',
        zIndex: 0,
    },
    headerContent: {
        maxWidth: '1020px',
        margin: '0 auto',
        padding: '28px 24px 0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },
    brandLogo: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '700',
        letterSpacing: '1px',
    },
    cardContainer: {
        zIndex: 1,
        width: '100%',
        maxWidth: '1020px',
        padding: '0 20px',
        boxSizing: 'border-box',
    },
    card: {
        backgroundColor: '#111b21',
        borderRadius: '12px',
        boxShadow: '0 17px 50px 0 rgba(0, 0, 0, 0.4)',
        display: 'flex',
        overflow: 'hidden',
        border: '1px solid #222d34',
        minHeight: '520px',
    },
    leftSection: {
        flex: 1.1,
        padding: '48px 44px',
        borderRight: '1px solid #222d34',
        display: 'flex',
        flexDirection: 'column',
    },
    title: {
        color: '#e9edef',
        fontSize: '26px',
        fontWeight: '300',
        marginBottom: '28px',
        lineHeight: '1.3',
    },
    instructions: {
        listStyle: 'none',
        padding: 0,
        margin: '0 0 28px 0',
        color: '#8696a0',
        fontSize: '15px',
        lineHeight: '2',
    },
    demoSection: {
        marginTop: 'auto',
        backgroundColor: '#182229',
        borderRadius: '10px',
        padding: '16px',
        border: '1px solid #222d34',
    },
    demoSectionTitle: {
        display: 'flex',
        alignItems: 'center',
        color: '#e9edef',
        fontSize: '13px',
        fontWeight: '600',
        marginBottom: '12px',
    },
    demoChipsList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
    },
    demoChip: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '20px',
        border: '1px solid #2f3b43',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    demoChipAvatar: {
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '11px',
        fontWeight: 'bold',
    },
    demoChipText: {
        fontSize: '12.5px',
        color: '#e9edef',
        fontWeight: '500',
    },
    rightSection: {
        flex: 0.9,
        padding: '48px 44px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#111b21',
    },
    formHeader: {
        marginBottom: '24px',
    },
    formTitle: {
        color: '#e9edef',
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '6px',
    },
    formSub: {
        color: '#8696a0',
        fontSize: '13px',
    },
    errorBox: {
        backgroundColor: 'rgba(241, 92, 109, 0.15)',
        border: '1px solid #f15c6d',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '20px',
        color: '#f15c6d',
        fontSize: '13.5px',
        display: 'flex',
        alignItems: 'center',
        lineHeight: '1.4',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        color: '#8696a0',
        fontSize: '12.5px',
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#202c33',
        border: '1px solid #2f3b43',
        borderRadius: '8px',
        padding: '12px 14px',
        color: '#e9edef',
        fontSize: '14.5px',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    passwordWrapper: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#202c33',
        border: '1px solid #2f3b43',
        borderRadius: '8px',
        padding: '0 12px 0 0',
    },
    passwordInput: {
        flex: 1,
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        padding: '12px 14px',
        color: '#e9edef',
        fontSize: '14.5px',
    },
    eyeBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
    },
    loginBtn: {
        marginTop: '8px',
        backgroundColor: '#00a884',
        color: '#111b21',
        border: 'none',
        borderRadius: '8px',
        padding: '13px',
        fontSize: '15px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
    },
    footer: {
        marginTop: '22px',
        textAlign: 'center',
    },
    linkText: {
        color: '#8696a0',
        fontSize: '13px',
    },
    link: {
        color: '#00a884',
        textDecoration: 'none',
        fontWeight: '600',
        marginLeft: '4px',
    },
};