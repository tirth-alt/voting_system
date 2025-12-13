'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [stats, setStats] = useState(null);
    const [config, setConfig] = useState(null);
    const [currentPin, setCurrentPin] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/admin/check-auth');
            const data = await response.json();
            setAuthenticated(data.authenticated);
            if (data.authenticated) {
                fetchStats();
                fetchConfig();
            }
        } catch (err) {
            console.error('Auth check failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/votes');
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const fetchConfig = async () => {
        try {
            const response = await fetch('/api/admin/config');
            const data = await response.json();
            setConfig(data);
        } catch (err) {
            console.error('Failed to fetch config:', err);
        }
    };

    const fetchCurrentPin = async () => {
        try {
            const response = await fetch('/api/admin/current-pin');
            const data = await response.json();
            setCurrentPin(data);
        } catch (err) {
            console.error('Failed to fetch current PIN:', err);
        }
    };

    const generateNewPin = async () => {
        try {
            const response = await fetch('/api/admin/current-pin', {
                method: 'POST'
            });
            const data = await response.json();
            if (response.ok) {
                setCurrentPin(data);
            }
        } catch (err) {
            console.error('Failed to generate PIN:', err);
        }
    };

    // Auto-refresh PIN every 2 seconds when authenticated
    useEffect(() => {
        if (authenticated) {
            fetchCurrentPin();
            const interval = setInterval(fetchCurrentPin, 2000); // Refresh every 2 seconds
            return () => clearInterval(interval);
        }
    }, [authenticated]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setAuthenticated(true);
                fetchStats();
                fetchConfig();
                fetchCurrentPin();
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            setAuthenticated(false);
            setEmail('');
            setPassword('');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const toggleVoting = async () => {
        try {
            const response = await fetch('/api/admin/toggle-voting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ votingOpen: !config.votingOpen })
            });

            if (response.ok) {
                fetchConfig();
            }
        } catch (err) {
            console.error('Failed to toggle voting:', err);
        }
    };

    const exportResults = async () => {
        try {
            const response = await fetch('/api/admin/export');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `election_results_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
                <h1 style={{ marginBottom: '20px' }}>Admin Login</h1>
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #333',
                                background: '#1a1a1a',
                                color: '#fff'
                            }}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #333',
                                background: '#1a1a1a',
                                color: '#fff'
                            }}
                            required
                        />
                    </div>
                    {error && <p style={{ color: '#ff4466', marginBottom: '15px' }}>{error}</p>}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        Login
                    </button>
                </form>
                <Link href="/" style={{ display: 'block', marginTop: '20px', textAlign: 'center', color: '#00f0ff' }}>
                    ← Back to Voting
                </Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Admin Dashboard</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/" className="btn btn-secondary">
                        ← Back to Voting
                    </Link>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>
            </div>

            {/* Current PIN Display - PROMINENT */}
            <div style={{
                background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                padding: '40px',
                borderRadius: '16px',
                border: '2px solid #00f0ff',
                marginBottom: '30px',
                textAlign: 'center',
                boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)'
            }}>
                <h2 style={{ marginBottom: '20px', color: '#00f0ff', fontSize: '1.5rem' }}>Current Voting PIN</h2>
                {currentPin?.currentPin ? (
                    <>
                        <div style={{
                            fontSize: '6rem',
                            fontWeight: 'bold',
                            letterSpacing: '0.5rem',
                            color: '#fff',
                            textShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
                            marginBottom: '20px',
                            fontFamily: 'monospace'
                        }}>
                            {currentPin.currentPin}
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '20px',
                            marginBottom: '20px'
                        }}>
                            <span style={{
                                padding: '8px 16px',
                                background: currentPin.pinUsed ? '#ff4466' : '#00ff88',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                                color: '#000'
                            }}>
                                {currentPin.pinUsed ? '🔴 USED' : '🟢 ACTIVE'}
                            </span>
                            <span style={{ color: '#a0a0a0', fontSize: '0.875rem' }}>
                                Generated: {new Date(currentPin.pinGeneratedAt).toLocaleTimeString()}
                            </span>
                        </div>
                        <button
                            onClick={generateNewPin}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.875rem' }}
                        >
                            🔄 Generate New PIN (Emergency)
                        </button>
                    </>
                ) : (
                    <>
                        <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>No PIN generated yet</p>
                        <button
                            onClick={generateNewPin}
                            className="btn btn-primary"
                        >
                            Generate First PIN
                        </button>
                    </>
                )}
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                    <h3 style={{ marginBottom: '10px', color: '#00f0ff' }}>Total Votes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.totalVotes || 0}</p>
                </div>

                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                    <h3 style={{ marginBottom: '10px', color: '#00f0ff' }}>Voting Status</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: config?.votingOpen ? '#00ff88' : '#ff4466' }}>
                        {config?.votingOpen ? 'OPEN' : 'CLOSED'}
                    </p>
                    <button onClick={toggleVoting} className="btn btn-secondary" style={{ marginTop: '10px', fontSize: '0.875rem' }}>
                        {config?.votingOpen ? 'Close Voting' : 'Open Voting'}
                    </button>
                </div>

                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                    <h3 style={{ marginBottom: '10px', color: '#00f0ff' }}>Actions</h3>
                    <button onClick={exportResults} className="btn btn-primary" style={{ width: '100%', fontSize: '0.875rem' }}>
                        📊 Export Results (CSV)
                    </button>
                </div>
            </div>

            {/* Votes by House */}
            {stats?.votesByHouse && stats.votesByHouse.length > 0 && (
                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333', marginBottom: '30px' }}>
                    <h2 style={{ marginBottom: '15px' }}>Votes by House</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                        {stats.votesByHouse.map((house) => (
                            <div key={house._id} style={{ textAlign: 'center', padding: '15px', background: '#222', borderRadius: '8px' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '5px' }}>{house.count}</div>
                                <div style={{ color: '#a0a0a0', textTransform: 'capitalize' }}>{house._id}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Votes */}
            {stats?.recentVotes && stats.recentVotes.length > 0 && (
                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                    <h2 style={{ marginBottom: '15px' }}>Recent Votes</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>House</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentVotes.map((vote, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '10px', textTransform: 'capitalize' }}>{vote.house}</td>
                                        <td style={{ padding: '10px', color: '#a0a0a0' }}>
                                            {new Date(vote.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
