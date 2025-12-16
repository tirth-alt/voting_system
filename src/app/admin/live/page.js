'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LiveResultsPage() {
    const [results, setResults] = useState([]);
    const [totalVotes, setTotalVotes] = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState('all');
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);

    // Position categories
    const positions = [
        { id: 'malePresident', name: 'Male President', color: '#00f0ff' },
        { id: 'femalePresident', name: 'Female President', color: '#bf5fff' },
        { id: 'campusAffairsSecretary', name: 'Campus Affairs Secretary', color: '#00ff88' },
        { id: 'sportsSecretary', name: 'Sports Secretary', color: '#ff6b35' },
        { id: 'culturalSecretary', name: 'Cultural Secretary', color: '#ff4466' },
        { id: 'academicSecretary', name: 'Academic Secretary', color: '#ffd700' },
        { id: 'leoCaptain', name: 'Leo Captain', color: '#ffd700' },
        { id: 'phoenixCaptain', name: 'Phoenix Captain', color: '#ef4444' },
        { id: 'tuskerCaptain', name: 'Tusker Captain', color: '#22c55e' },
        { id: 'kongCaptain', name: 'Kong Captain', color: '#3b82f6' },
    ];

    // Check authentication on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/admin/check-auth');
            const data = await response.json();
            setAuthenticated(data.authenticated);
            if (data.authenticated) {
                setMounted(true);
                fetchResults();
                const interval = setInterval(fetchResults, 2000);
                return () => clearInterval(interval);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            setAuthenticated(false);
        } finally {
            setAuthChecking(false);
        }
    };

    useEffect(() => {
        if (authenticated) {
            const interval = setInterval(fetchResults, 2000);
            return () => clearInterval(interval);
        }
    }, [authenticated]);

    const fetchResults = async () => {
        try {
            const [tallyRes, votesRes] = await Promise.all([
                fetch('/api/live-results'),  // Use public endpoint
                fetch('/api/admin/votes')
            ]);

            const tallyData = await tallyRes.json();
            const votesData = await votesRes.json();

            console.log('Tally data:', tallyData);  // Debug

            // API returns 'candidates'
            if (tallyData.candidates && Array.isArray(tallyData.candidates)) {
                setResults(tallyData.candidates);
            }
            if (votesData.totalVotes !== undefined) {
                setTotalVotes(votesData.totalVotes);
            }
            setLastUpdated(new Date());
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch results:', err);
            setLoading(false);
        }
    };

    // Group results by position
    const groupedResults = positions.map(pos => {
        const candidates = results
            .filter(r => r.positionId === pos.id)
            .sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
        return { ...pos, candidates };
    }).filter(pos => pos.candidates.length > 0);

    // Get max points for progress bar scaling
    const getMaxPoints = (candidates) => {
        if (!candidates || candidates.length === 0) return 1;
        return Math.max(...candidates.map(c => c.total_points || 0), 1);
    };

    // Filter positions
    const displayedPositions = selectedPosition === 'all'
        ? groupedResults
        : groupedResults.filter(p => p.id === selectedPosition);

    // Show loading while checking auth
    if (authChecking) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#0a0a0a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <p>Checking authentication...</p>
            </div>
        );
    }

    // Redirect to admin login if not authenticated
    if (!authenticated) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#0a0a0a',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px'
            }}>
                <h1 style={{ fontSize: '2rem' }}>🔒 Access Denied</h1>
                <p style={{ color: '#a0a0a0' }}>You must be logged in as admin to view live results.</p>
                <Link
                    href="/admin"
                    style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #00f0ff, #0088aa)',
                        color: '#000',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600'
                    }}
                >
                    Go to Admin Login
                </Link>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0a',
            color: '#fff',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Link href="/admin" style={{
                        color: '#a0a0a0',
                        textDecoration: 'none',
                        fontSize: '1.5rem'
                    }}>
                        ←
                    </Link>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        📊 <span style={{ background: 'linear-gradient(135deg, #00f0ff, #bf5fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LIVE RESULTS</span>
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <span style={{
                        color: '#a0a0a0',
                        fontSize: '0.875rem'
                    }} suppressHydrationWarning>
                        Last updated: {mounted && lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
                    </span>
                    <button
                        onClick={fetchResults}
                        style={{
                            padding: '8px 16px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                    >
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                padding: '15px 20px',
                background: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #333',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div>
                    <select
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                        style={{
                            padding: '10px 20px',
                            background: '#222',
                            color: '#fff',
                            border: '1px solid #444',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Positions</option>
                        {positions.map(pos => (
                            <option key={pos.id} value={pos.id}>{pos.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 20px',
                    background: '#222',
                    borderRadius: '8px'
                }}>
                    <span style={{ color: '#a0a0a0' }}>Total Votes:</span>
                    <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#00ff88'
                    }}>
                        {totalVotes}
                    </span>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '50px', color: '#a0a0a0' }}>
                    Loading results...
                </div>
            )}

            {/* Results Grid */}
            {!loading && displayedPositions.map(position => (
                <div
                    key={position.id}
                    style={{
                        marginBottom: '30px',
                        background: '#1a1a1a',
                        borderRadius: '16px',
                        border: '1px solid #333',
                        overflow: 'hidden'
                    }}
                >
                    {/* Position Header */}
                    <div style={{
                        padding: '15px 20px',
                        borderBottom: '1px solid #333',
                        background: `linear-gradient(135deg, ${position.color}15, transparent)`
                    }}>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: position.color,
                            margin: 0
                        }}>
                            {position.name}
                        </h2>
                    </div>

                    {/* Candidates */}
                    <div style={{ padding: '15px 20px' }}>
                        {position.candidates.map((candidate, index) => {
                            const maxPoints = getMaxPoints(position.candidates);
                            const pref1Width = maxPoints > 0 ? ((candidate.pref1_count || 0) * 2 / maxPoints) * 100 : 0;
                            const pref2Width = maxPoints > 0 ? ((candidate.pref2_count || 0) / maxPoints) * 100 : 0;

                            return (
                                <div
                                    key={candidate.id || index}
                                    style={{
                                        padding: '15px',
                                        marginBottom: '10px',
                                        background: index === 0 ? 'rgba(0, 255, 136, 0.05)' : '#222',
                                        borderRadius: '10px',
                                        border: index === 0 ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid #333'
                                    }}
                                >
                                    {/* Candidate Name Row */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: index === 0 ? '#00ff88' : '#444',
                                                color: index === 0 ? '#000' : '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: '700',
                                                fontSize: '0.875rem'
                                            }}>
                                                {index + 1}
                                            </span>
                                            <span style={{
                                                fontWeight: '600',
                                                fontSize: '1.1rem',
                                                color: index === 0 ? '#00ff88' : '#fff'
                                            }}>
                                                {candidate.name}
                                            </span>
                                        </div>
                                        <span style={{
                                            fontSize: '1.5rem',
                                            fontWeight: '700',
                                            color: '#00f0ff'
                                        }}>
                                            {candidate.total_points || 0} pts
                                        </span>
                                    </div>

                                    {/* Vote Counts */}
                                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                        {/* Pref 1 */}
                                        <div style={{ flex: 1, minWidth: '150px' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '5px',
                                                fontSize: '0.8rem'
                                            }}>
                                                <span style={{ color: '#00ff88' }}>Pref 1 (×2)</span>
                                                <span style={{ color: '#00ff88', fontWeight: '600' }}>
                                                    {candidate.pref1_count || 0}
                                                </span>
                                            </div>
                                            <div style={{
                                                height: '8px',
                                                background: '#333',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${Math.min(pref1Width, 100)}%`,
                                                    height: '100%',
                                                    background: 'linear-gradient(90deg, #00ff88, #00cc6a)',
                                                    borderRadius: '4px',
                                                    transition: 'width 0.5s ease'
                                                }} />
                                            </div>
                                        </div>

                                        {/* Pref 2 */}
                                        <div style={{ flex: 1, minWidth: '150px' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '5px',
                                                fontSize: '0.8rem'
                                            }}>
                                                <span style={{ color: '#bf5fff' }}>Pref 2 (×1)</span>
                                                <span style={{ color: '#bf5fff', fontWeight: '600' }}>
                                                    {candidate.pref2_count || 0}
                                                </span>
                                            </div>
                                            <div style={{
                                                height: '8px',
                                                background: '#333',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${Math.min(pref2Width, 100)}%`,
                                                    height: '100%',
                                                    background: 'linear-gradient(90deg, #bf5fff, #9945ff)',
                                                    borderRadius: '4px',
                                                    transition: 'width 0.5s ease'
                                                }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {position.candidates.length === 0 && (
                            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                                No votes yet
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* No Results */}
            {!loading && displayedPositions.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '50px',
                    color: '#666'
                }}>
                    No results to display
                </div>
            )}

            {/* Footer */}
            <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#444',
                fontSize: '0.8rem'
            }}>
                Auto-refreshes every 2 seconds • SST Election 2026
            </div>
        </div>
    );
}
