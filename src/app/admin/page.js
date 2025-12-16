'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const [authenticated, setAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null); // 'dean' or 'commission'
    const [authMethod, setAuthMethod] = useState(null); // 'oauth' or 'traditional'
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [stats, setStats] = useState(null);
    const [config, setConfig] = useState(null);
    const [currentPin, setCurrentPin] = useState(null);
    const [results, setResults] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState('all');
    const [mounted, setMounted] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');

    // Encryption state
    const [encryptionStatus, setEncryptionStatus] = useState(null);
    const [showEncryptionModal, setShowEncryptionModal] = useState(false);
    const [encryptionPassword, setEncryptionPassword] = useState('');
    const [encryptionConfirmPassword, setEncryptionConfirmPassword] = useState('');
    const [showDecryptModal, setShowDecryptModal] = useState(false);
    const [decryptPassword, setDecryptPassword] = useState('');
    const [decryptedResults, setDecryptedResults] = useState(null);
    const [encryptionError, setEncryptionError] = useState('');

    useEffect(() => {
        setMounted(true);
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/admin/check-auth');
            const data = await response.json();
            setAuthenticated(data.authenticated);
            setUserRole(data.role || null);
            setAuthMethod(data.authMethod || null);
            if (data.authenticated) {
                fetchStats();
                fetchConfig();
                // Only fetch results if Dean, or if Commission and voting is closed
                if (data.role === 'dean') {
                    fetchResults();
                }
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

    const fetchResults = async () => {
        try {
            const response = await fetch('/api/admin/tally');
            if (response.status === 401) {
                console.log('Not authorized to view results');
                setResults(null);
                return;
            }
            const data = await response.json();
            setResults(data.candidates || []);
        } catch (err) {
            console.error('Failed to fetch results:', err);
            setResults(null);
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

    // Auto-refresh PIN and results every 2 seconds when authenticated
    useEffect(() => {
        if (authenticated) {
            fetchCurrentPin();
            // Only fetch results if Dean, or if Commission and voting is closed
            if (userRole === 'dean' || (userRole === 'commission' && config && !config.votingOpen)) {
                fetchResults();
            }
            const interval = setInterval(() => {
                fetchCurrentPin();
                if (userRole === 'dean' || (userRole === 'commission' && config && !config.votingOpen)) {
                    fetchResults();
                }
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [authenticated, userRole, config]);

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
            if (authMethod === 'oauth') {
                // Sign out from Google OAuth
                await signOut({ redirect: false });
            } else {
                // Traditional logout
                await fetch('/api/admin/logout', { method: 'POST' });
            }
            setAuthenticated(false);
            setUserRole(null);
            setAuthMethod(null);
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

    const handleResetAll = async () => {
        if (resetConfirmText !== 'RESET') {
            alert('Please type RESET to confirm');
            return;
        }

        try {
            const response = await fetch('/api/admin/reset-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmCode: resetConfirmText })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'All votes and candidate counts have been reset');
                setShowResetModal(false);
                setResetConfirmText('');
                // Refresh data
                fetchStats();
                fetchResults();
            } else {
                alert(data.error || 'Failed to reset data');
            }
        } catch (err) {
            console.error('Reset failed:', err);
            alert('Reset failed');
        }
    };

    // Encryption functions
    const fetchEncryptionStatus = async () => {
        try {
            const response = await fetch('/api/admin/encryption');
            if (response.ok) {
                const data = await response.json();
                setEncryptionStatus(data);
            }
        } catch (err) {
            console.error('Failed to fetch encryption status:', err);
        }
    };

    const handleEnableEncryption = async () => {
        setEncryptionError('');

        if (encryptionPassword.length < 8) {
            setEncryptionError('Password must be at least 8 characters');
            return;
        }

        if (encryptionPassword !== encryptionConfirmPassword) {
            setEncryptionError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/admin/encryption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: encryptionPassword,
                    confirmPassword: encryptionConfirmPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Encryption enabled! All future votes will be encrypted. Remember your password!');
                setShowEncryptionModal(false);
                setEncryptionPassword('');
                setEncryptionConfirmPassword('');
                fetchEncryptionStatus();
            } else {
                setEncryptionError(data.error || 'Failed to enable encryption');
            }
        } catch (err) {
            console.error('Enable encryption failed:', err);
            setEncryptionError('Failed to enable encryption');
        }
    };

    const handleDecryptResults = async () => {
        setEncryptionError('');

        if (!decryptPassword) {
            setEncryptionError('Password is required');
            return;
        }

        try {
            const response = await fetch('/api/admin/decrypt-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: decryptPassword })
            });

            const data = await response.json();

            if (response.ok) {
                setDecryptedResults(data);
                setShowDecryptModal(false);
                setDecryptPassword('');
            } else {
                setEncryptionError(data.error || 'Decryption failed');
            }
        } catch (err) {
            console.error('Decrypt failed:', err);
            setEncryptionError('Decryption failed');
        }
    };

    // Fetch encryption status when authenticated as Dean
    useEffect(() => {
        if (authenticated && userRole === 'dean') {
            fetchEncryptionStatus();
        }
    }, [authenticated, userRole]);

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
                <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>Admin Login</h1>

                {/* Google Sign-In for Dean */}
                <div style={{ marginBottom: '30px' }}>
                    <button
                        onClick={() => signIn('google', { callbackUrl: '/admin' })}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#fff',
                            color: '#000',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        Sign in with Google
                    </button>
                    <p style={{ textAlign: 'center', margin: '15px 0', color: '#666', fontSize: '0.875rem' }}>For Dean or Election Commission</p>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '20px 0',
                    color: '#666',
                    fontSize: '0.875rem'
                }}>
                    <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
                    <span style={{ padding: '0 15px' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
                </div>

                {/* Traditional Login for Election Commission */}
                <p style={{ textAlign: 'center', marginBottom: '15px', color: '#a0a0a0', fontSize: '0.875rem' }}>Or use Traditional Login</p>
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
                    <Link href="/" className="btn btn-primary" style={{ width: '70%', fontSize: '0.65rem', marginBottom: '1px', marginTop: '1px', background: 'none', color: '#00f0ff', border: 'none', boxShadow: 'none', marginRight: '10px' }}>
                        ← Back to Voting
                    </Link>
                    <button onClick={handleLogout} className="btn btn-primary" style={{ width: '50%', fontSize: '0.85rem', marginBottom: '1px', marginTop: '1px' }}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Current PIN Display - PROMINENT (Commission Only, when voting is open) */}
            {userRole === 'commission' && config?.votingOpen && (
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
                                    {currentPin.pinUsed ? 'USED' : 'ACTIVE'}
                                </span>
                                <span style={{ color: '#a0a0a0', fontSize: '0.875rem' }} suppressHydrationWarning>
                                    Generated: {mounted && currentPin.pinGeneratedAt ? new Date(currentPin.pinGeneratedAt).toLocaleTimeString() : '--:--:--'}
                                </span>
                            </div>
                            <button
                                onClick={generateNewPin}
                                className="btn btn-primary" style={{ width: '50%', fontSize: '0.875rem', marginBottom: '10px' }}
                            >
                                Generate New PIN (Emergency)
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
            )}

            {/* Voting Closed Message for Commission */}
            {userRole === 'commission' && !config?.votingOpen && (
                <div style={{
                    background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                    padding: '40px',
                    borderRadius: '16px',
                    border: '2px solid #ff4466',
                    marginBottom: '30px',
                    textAlign: 'center'
                }}>
                    <h2 style={{ color: '#ff4466', marginBottom: '15px' }}>🔒 Voting is Closed</h2>
                    <p style={{ color: '#a0a0a0' }}>
                        The Dean has not opened voting yet. PIN generation will be available when voting opens.
                    </p>
                </div>
            )}

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
                    {userRole === 'dean' && (
                        <>
                            <button
                                onClick={toggleVoting}
                                className="btn btn-primary"
                                style={{ width: '100%', fontSize: '0.875rem', marginBottom: '10px' }}
                                disabled={!config?.votingOpen && !encryptionStatus?.encryptionEnabled}
                            >
                                {config?.votingOpen ? 'Close Voting' : 'Open Voting'}
                            </button>
                            {!encryptionStatus?.encryptionEnabled && !config?.votingOpen && (
                                <p style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '-5px' }}>
                                    ⚠️ Enable encryption before opening voting
                                </p>
                            )}
                        </>
                    )}
                </div>

                {userRole === 'dean' && (
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                        <h3 style={{ marginBottom: '15px', color: '#00f0ff' }}>Dean Actions</h3>
                        {/* <button onClick={exportResults} className="btn btn-primary" style={{ width: '100%', fontSize: '0.875rem', marginBottom: '10px' }}>
                            Export Results (CSV)
                        </button> */}
                        <button onClick={() => setShowResetModal(true)} className="btn btn-primary" style={{ background: '#f93e3eff', width: '100%', fontSize: '0.875rem', marginBottom: '10px', boxShadow: 'var(--glow-red)' }}>
                            Reset Elections
                        </button>

                        {/* Encryption Section */}
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #333' }}>
                            <h4 style={{ marginBottom: '10px', color: '#bf5fff', fontSize: '0.9rem' }}>🔐 Vote Encryption</h4>
                            {encryptionStatus?.encryptionEnabled ? (
                                <div>
                                    <p style={{ color: '#00ff88', fontSize: '0.8rem', marginBottom: '10px' }}>
                                        ✅ Encryption ENABLED
                                    </p>
                                    <button
                                        onClick={() => setShowDecryptModal(true)}
                                        className="btn btn-primary"
                                        style={{ width: '100%', fontSize: '0.8rem', background: 'linear-gradient(135deg, #bf5fff, #7b2cbf)' }}
                                    >
                                        🔓 Decrypt Results
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '10px' }}>
                                        Encryption protects vote data from database breaches
                                    </p>
                                    <button
                                        onClick={() => setShowEncryptionModal(true)}
                                        className="btn btn-primary"
                                        style={{ width: '100%', fontSize: '0.8rem', background: 'linear-gradient(135deg, #bf5fff, #7b2cbf)' }}
                                        disabled={stats?.totalVotes > 0}
                                    >
                                        {stats?.totalVotes > 0 ? 'Cannot enable (votes exist)' : '🔐 Enable Encryption'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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

            {/* Election Results */}
            {userRole === 'commission' && config?.votingOpen ? (
                /* Commission cannot see results during voting */
                <div style={{ background: '#1a1a1a', padding: '40px', borderRadius: '12px', border: '1px solid #333', marginBottom: '30px', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '15px', color: '#00f0ff' }}>🔒 Election Results</h2>
                    <p style={{ color: '#a0a0a0', fontSize: '1.125rem', marginBottom: '10px' }}>
                        Results are hidden while voting is active
                    </p>
                    <p style={{ color: '#666', fontSize: '0.875rem' }}>
                        Close voting to view detailed results. Only the Dean can view results during voting.
                    </p>
                </div>
            ) : results && results.length > 0 && (
                /* Dean always sees results, Commission sees after voting closes */
                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>Election Results {userRole === 'dean' && config?.votingOpen && <span style={{ color: '#00ff88', fontSize: '0.875rem' }}>(Dean Access)</span>}</h2>
                        <select
                            value={selectedPosition}
                            onChange={(e) => setSelectedPosition(e.target.value)}
                            style={{
                                padding: '8px 16px',
                                background: '#222',
                                color: '#fff',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="all">All Positions</option>
                            <option value="malePresident">Male President</option>
                            <option value="femalePresident">Female President</option>
                            <option value="campusAffairsSecretary">Campus Affairs Secretary</option>
                            <option value="sportsSecretary">Sports Secretary</option>
                            <option value="culturalSecretary">Cultural Secretary</option>
                            <option value="academicSecretary">Academic Secretary</option>
                            <option value="leoCaptain">Leo Captain</option>
                            <option value="phoenixCaptain">Phoenix Captain</option>
                            <option value="tuskerCaptain">Tusker Captain</option>
                            <option value="kongCaptain">Kong Captain</option>
                        </select>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #333' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#00f0ff' }}>Rank</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#00f0ff' }}>Candidate</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#00f0ff' }}>Position</th>
                                    <th style={{ padding: '12px', textAlign: 'center', color: '#00f0ff' }}>Pref 1</th>
                                    <th style={{ padding: '12px', textAlign: 'center', color: '#00f0ff' }}>Pref 2</th>
                                    <th style={{ padding: '12px', textAlign: 'center', color: '#00f0ff' }}>Total Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results
                                    .filter(candidate => selectedPosition === 'all' || candidate.positionId === selectedPosition)
                                    .sort((a, b) => b.total_points - a.total_points)
                                    .map((candidate, index) => (
                                        <tr key={candidate.id} style={{ borderBottom: '1px solid #222' }}>
                                            <td style={{ padding: '12px', fontWeight: 'bold', color: index === 0 ? '#00ff88' : '#fff' }}>
                                                {index + 1}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontWeight: '500' }}>{candidate.name}</div>
                                                {candidate.isNota && <span style={{ fontSize: '0.75rem', color: '#a0a0a0' }}>(NOTA)</span>}
                                            </td>
                                            <td style={{ padding: '12px', color: '#a0a0a0', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                                                {candidate.positionId?.replace(/([A-Z])/g, ' $1').trim()}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#00ff88' }}>
                                                {candidate.pref1_count || 0}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#bf5fff' }}>
                                                {candidate.pref2_count || 0}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.125rem', color: '#00f0ff' }}>
                                                {candidate.total_points || 0}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
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
                                        <td style={{ padding: '10px', color: '#a0a0a0' }} suppressHydrationWarning>
                                            {mounted && vote.timestamp ? new Date(vote.timestamp).toLocaleString() : 'Loading...'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        padding: '30px',
                        borderRadius: '12px',
                        border: '2px solid #ff4466',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h2 style={{ color: '#ff4466', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            ⚠️ Reset All Votes
                        </h2>
                        <p style={{ color: '#a0a0a0', marginBottom: '10px' }}>
                            This will permanently delete ALL votes and reset candidate counts to zero.
                        </p>
                        <p style={{ color: '#ff6688', fontWeight: 'bold', marginBottom: '20px' }}>
                            This action CANNOT be undone!
                        </p>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', color: '#fff' }}>
                                Type <strong>RESET</strong> to confirm:
                            </label>
                            <input
                                type="text"
                                value={resetConfirmText}
                                onChange={(e) => setResetConfirmText(e.target.value)}
                                placeholder="Type RESET here"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    background: '#222',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    fontFamily: 'monospace',
                                    letterSpacing: '2px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setShowResetModal(false);
                                    setResetConfirmText('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#333',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResetAll}
                                disabled={resetConfirmText !== 'RESET'}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: resetConfirmText === 'RESET'
                                        ? 'linear-gradient(135deg, #ff4466, #cc1144)'
                                        : '#444',
                                    color: resetConfirmText === 'RESET' ? '#fff' : '#666',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: resetConfirmText === 'RESET' ? 'pointer' : 'not-allowed',
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                Reset All Votes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Encryption Setup Modal */}
            {showEncryptionModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        padding: '30px',
                        borderRadius: '12px',
                        border: '2px solid #bf5fff',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h2 style={{ color: '#bf5fff', marginBottom: '20px' }}>🔐 Enable Vote Encryption</h2>

                        <p style={{ color: '#a0a0a0', marginBottom: '10px', fontSize: '0.9rem' }}>
                            Create a password to encrypt all votes. Only you can decrypt results with this password.
                        </p>

                        <p style={{ color: '#ff6688', fontWeight: 'bold', marginBottom: '20px', fontSize: '0.85rem' }}>
                            ⚠️ WARNING: If you forget this password, votes CANNOT be recovered!
                        </p>

                        {encryptionError && (
                            <p style={{ color: '#ff4466', marginBottom: '15px', fontSize: '0.9rem' }}>{encryptionError}</p>
                        )}

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>Password (min 8 characters)</label>
                            <input
                                type="password"
                                value={encryptionPassword}
                                onChange={(e) => setEncryptionPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    background: '#222',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>Confirm Password</label>
                            <input
                                type="password"
                                value={encryptionConfirmPassword}
                                onChange={(e) => setEncryptionConfirmPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    background: '#222',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setShowEncryptionModal(false);
                                    setEncryptionPassword('');
                                    setEncryptionConfirmPassword('');
                                    setEncryptionError('');
                                }}
                                style={{
                                    flex: 1, padding: '12px', background: '#333', color: '#fff',
                                    border: 'none', borderRadius: '8px', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEnableEncryption}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'linear-gradient(135deg, #bf5fff, #7b2cbf)',
                                    color: '#fff', border: 'none', borderRadius: '8px',
                                    cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                Enable Encryption
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Decrypt Results Modal */}
            {showDecryptModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        padding: '30px',
                        borderRadius: '12px',
                        border: '2px solid #bf5fff',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h2 style={{ color: '#bf5fff', marginBottom: '20px' }}>🔓 Decrypt Results</h2>

                        <p style={{ color: '#a0a0a0', marginBottom: '20px', fontSize: '0.9rem' }}>
                            Enter your encryption password to decrypt and view the election results.
                        </p>

                        {encryptionError && (
                            <p style={{ color: '#ff4466', marginBottom: '15px', fontSize: '0.9rem' }}>{encryptionError}</p>
                        )}

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>Password</label>
                            <input
                                type="password"
                                value={decryptPassword}
                                onChange={(e) => setDecryptPassword(e.target.value)}
                                placeholder="Enter your encryption password"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    background: '#222',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setShowDecryptModal(false);
                                    setDecryptPassword('');
                                    setEncryptionError('');
                                }}
                                style={{
                                    flex: 1, padding: '12px', background: '#333', color: '#fff',
                                    border: 'none', borderRadius: '8px', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDecryptResults}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'linear-gradient(135deg, #bf5fff, #7b2cbf)',
                                    color: '#fff', border: 'none', borderRadius: '8px',
                                    cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                Decrypt & View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Decrypted Results Display */}
            {decryptedResults && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    zIndex: 1000,
                    overflow: 'auto',
                    padding: '50px 20px'
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        padding: '30px',
                        borderRadius: '12px',
                        border: '2px solid #00ff88',
                        maxWidth: '800px',
                        width: '100%'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: '#00ff88' }}>🔓 Decrypted Results</h2>
                            <button
                                onClick={() => setDecryptedResults(null)}
                                style={{
                                    padding: '8px 16px', background: '#333', color: '#fff',
                                    border: 'none', borderRadius: '8px', cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <p style={{ color: '#a0a0a0', marginBottom: '20px', fontSize: '0.9rem' }}>
                            Total votes: {decryptedResults.totalVotes} | Decrypted: {decryptedResults.decryptedVotes}
                            {decryptedResults.errorCount > 0 && ` | Errors: ${decryptedResults.errorCount}`}
                        </p>

                        {/* General Positions (non-house captain) */}
                        <h3 style={{ color: '#00f0ff', marginBottom: '15px', fontSize: '1.2rem', borderBottom: '2px solid #00f0ff', paddingBottom: '10px' }}>
                            📊 General Positions
                        </h3>
                        {Object.entries(
                            decryptedResults.results.reduce((acc, candidate) => {
                                const pos = candidate.positionId || candidate.position;
                                if (!acc[pos]) acc[pos] = [];
                                acc[pos].push(candidate);
                                return acc;
                            }, {})
                        )
                            .filter(([positionId]) => !positionId.includes('Captain'))
                            .map(([positionId, candidates]) => (
                                <div key={positionId} style={{ marginBottom: '25px' }}>
                                    <h4 style={{
                                        color: '#fff',
                                        marginBottom: '10px',
                                        fontSize: '1rem',
                                        textTransform: 'capitalize',
                                    }}>
                                        {positionId.replace(/([A-Z])/g, ' $1').trim()}
                                    </h4>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#222' }}>
                                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.85rem' }}>Rank</th>
                                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.85rem' }}>Candidate</th>
                                                <th style={{ padding: '10px', textAlign: 'center', fontSize: '0.85rem' }}>1st Pref</th>
                                                <th style={{ padding: '10px', textAlign: 'center', fontSize: '0.85rem' }}>2nd Pref</th>
                                                <th style={{ padding: '10px', textAlign: 'center', fontSize: '0.85rem' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {candidates.sort((a, b) => b.total_points - a.total_points).map((candidate, idx) => (
                                                <tr key={idx} style={{
                                                    borderBottom: '1px solid #333',
                                                    background: idx === 0 ? 'rgba(0, 255, 136, 0.1)' : 'transparent'
                                                }}>
                                                    <td style={{ padding: '10px', fontWeight: 'bold', color: idx === 0 ? '#00ff88' : '#fff' }}>
                                                        {idx === 0 ? '🏆' : `#${idx + 1}`}
                                                    </td>
                                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                                        {candidate.name}
                                                    </td>
                                                    <td style={{ padding: '10px', textAlign: 'center', color: '#00ff88', fontWeight: 'bold' }}>
                                                        {candidate.pref1_count}
                                                    </td>
                                                    <td style={{ padding: '10px', textAlign: 'center', color: '#bf5fff' }}>
                                                        {candidate.pref2_count}
                                                    </td>
                                                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#00f0ff' }}>
                                                        {candidate.total_points}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}

                        {/* House Captains - Separate Section */}
                        <h3 style={{ color: '#FFD700', marginTop: '30px', marginBottom: '20px', fontSize: '1.2rem', borderBottom: '2px solid #FFD700', paddingBottom: '10px' }}>
                            🏠 House Captains
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                            {[
                                { key: 'leoCaptain', name: 'Leo', color: '#FFD700', emoji: '🦁' },
                                { key: 'phoenixCaptain', name: 'Phoenix', color: '#FF4500', emoji: '🔥' },
                                { key: 'tuskerCaptain', name: 'Tusker', color: '#00FF88', emoji: '🐘' },
                                { key: 'kongCaptain', name: 'Kong', color: '#4169E1', emoji: '🦍' }
                            ].map(house => {
                                const houseCandidates = decryptedResults.results
                                    .filter(c => (c.positionId || c.position) === house.key)
                                    .sort((a, b) => b.total_points - a.total_points);

                                // Always show house card, even if no votes

                                return (
                                    <div key={house.key} style={{
                                        background: '#222',
                                        borderRadius: '10px',
                                        padding: '15px',
                                        border: `2px solid ${house.color}`
                                    }}>
                                        <h4 style={{
                                            color: house.color,
                                            marginBottom: '15px',
                                            fontSize: '1.1rem',
                                            textAlign: 'center'
                                        }}>
                                            {house.emoji} {house.name} House
                                        </h4>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#1a1a1a' }}>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem' }}>#</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem' }}>Candidate</th>
                                                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '0.8rem' }}>Points</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {houseCandidates.length > 0 ? houseCandidates.map((candidate, idx) => (
                                                    <tr key={idx} style={{
                                                        borderBottom: '1px solid #333',
                                                        background: idx === 0 ? `${house.color}22` : 'transparent'
                                                    }}>
                                                        <td style={{ padding: '8px', fontWeight: 'bold', color: idx === 0 ? house.color : '#fff' }}>
                                                            {idx === 0 ? '🏆' : `${idx + 1}`}
                                                        </td>
                                                        <td style={{ padding: '8px', fontWeight: idx === 0 ? 'bold' : 'normal' }}>
                                                            {candidate.name}
                                                        </td>
                                                        <td style={{
                                                            padding: '8px',
                                                            textAlign: 'center',
                                                            fontWeight: 'bold',
                                                            color: idx === 0 ? house.color : '#00f0ff'
                                                        }}>
                                                            {candidate.total_points}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                                            No votes recorded for this house yet
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        {houseCandidates.length > 0 && (
                                            <div style={{
                                                textAlign: 'center',
                                                marginTop: '10px',
                                                padding: '8px',
                                                background: `${house.color}33`,
                                                borderRadius: '6px',
                                                fontSize: '0.85rem'
                                            }}>
                                                <strong style={{ color: house.color }}>Winner:</strong> {houseCandidates[0].name}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

